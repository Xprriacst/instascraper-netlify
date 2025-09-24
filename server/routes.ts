import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { apifyService } from "./services/apifyService";
import { exportService } from "./services/exportService";
import { insertCampaignSchema, insertCreditTransactionSchema } from "@shared/schema";
import path from 'path';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Campaign routes
  app.post('/api/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const validatedData = insertCampaignSchema.parse(req.body);

      // Check if user has enough credits
      const userCredits = user.credits || 0;
      if (userCredits < validatedData.requestCount) {
        return res.status(400).json({ message: "Insufficient credits" });
      }

      // Create campaign
      const campaign = await storage.createCampaign({
        userId,
        hashtag: validatedData.hashtag,
        requestCount: validatedData.requestCount,
        status: 'pending',
      });

      // Deduct credits
      await storage.updateUserCredits(userId, userCredits - validatedData.requestCount);

      // Create credit transaction
      await storage.createCreditTransaction({
        userId,
        amount: -validatedData.requestCount,
        type: 'usage',
        description: `Campaign: ${validatedData.hashtag}`,
      });

      // Start Apify scraping
      try {
        const runId = await apifyService.startScrapingRun({
          hashtags: [validatedData.hashtag],
          resultsLimit: validatedData.requestCount,
        });

        await storage.updateCampaign(campaign.id, {
          apifyRunId: runId,
          status: 'running',
        });

        res.json({ ...campaign, apifyRunId: runId, status: 'running' });
      } catch (apifyError) {
        // Refund credits if Apify fails
        await storage.updateUserCredits(userId, userCredits);
        await storage.createCreditTransaction({
          userId,
          amount: validatedData.requestCount,
          type: 'refund',
          description: `Refund for failed campaign: ${validatedData.hashtag}`,
        });

        await storage.updateCampaign(campaign.id, { status: 'failed' });
        
        res.status(500).json({ message: "Failed to start scraping campaign" });
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  app.get('/api/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaigns = await storage.getCampaignsByUser(userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.get('/api/campaigns/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaign = await storage.getCampaign(req.params.id);
      
      if (!campaign || campaign.userId !== userId) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      res.json(campaign);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ message: "Failed to fetch campaign" });
    }
  });

  // Campaign status check and results update
  app.post('/api/campaigns/:id/check-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaign = await storage.getCampaign(req.params.id);
      
      if (!campaign || campaign.userId !== userId) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      if (!campaign.apifyRunId) {
        return res.status(400).json({ message: "No Apify run ID found" });
      }

      const status = await apifyService.checkRunStatus(campaign.apifyRunId);
      
      if (status === 'SUCCEEDED' && campaign.status !== 'completed') {
        // Get results and update campaign
        const results = await apifyService.getRunResults(campaign.apifyRunId);
        
        await storage.updateCampaign(campaign.id, {
          status: 'completed',
          completedRequests: results.length,
          resultData: results,
        });

        return res.json({ 
          status: 'completed', 
          completedRequests: results.length,
          totalResults: results.length 
        });
      } else if (status === 'FAILED' || status === 'ABORTED') {
        await storage.updateCampaign(campaign.id, { status: 'failed' });
        return res.json({ status: 'failed' });
      }

      res.json({ status: status.toLowerCase() });
    } catch (error) {
      console.error("Error checking campaign status:", error);
      res.status(500).json({ message: "Failed to check campaign status" });
    }
  });

  // Download campaign results
  app.get('/api/campaigns/:id/download', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaign = await storage.getCampaign(req.params.id);
      
      if (!campaign || campaign.userId !== userId) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      if (campaign.status !== 'completed' || !campaign.resultData) {
        return res.status(400).json({ message: "Campaign not completed or no data available" });
      }

      const format = req.query.format as string || 'excel';
      const filename = `${campaign.hashtag}_${campaign.id}_${Date.now()}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      
      let filePath: string;
      if (format === 'csv') {
        filePath = await exportService.exportToCSV(campaign.resultData as any, filename);
      } else {
        filePath = await exportService.exportToExcel(campaign.resultData as any, filename);
      }

      // Update campaign with file path
      await storage.updateCampaign(campaign.id, { filePath });

      // Set headers explicitly to ensure proper filename
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      
      res.download(filePath, filename, (err) => {
        if (err) {
          console.error("Error downloading file:", err);
          res.status(500).json({ message: "Failed to download file" });
        }
        // Clean up file after download
        setTimeout(() => exportService.deleteFile(filePath), 5000);
      });
    } catch (error) {
      console.error("Error downloading campaign results:", error);
      res.status(500).json({ message: "Failed to download results" });
    }
  });

  // Credit management routes
  app.get('/api/credits/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getCreditTransactionsByUser(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching credit transactions:", error);
      res.status(500).json({ message: "Failed to fetch credit transactions" });
    }
  });

  // Stripe subscription for credit purchases
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    let user = await storage.getUser(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
          expand: ['latest_invoice.payment_intent'],
        });

        const clientSecret = (subscription.latest_invoice as any)?.payment_intent?.client_secret;
        console.log('Existing subscription found:', {
          subscriptionId: subscription.id,
          clientSecret: !!clientSecret,
          status: subscription.status,
          latestInvoiceStatus: (subscription.latest_invoice as any)?.status,
        });

        // If no clientSecret, force creation of new subscription
        if (!clientSecret || subscription.status !== 'active') {
          console.log('No valid clientSecret or inactive subscription, clearing and creating new one');
          await storage.updateUserStripeInfo(user.id, user.stripeCustomerId || '', null);
        } else {
          res.send({
            subscriptionId: subscription.id,
            clientSecret: clientSecret,
          });
          return;
        }
      } catch (error: any) {
        // If subscription doesn't exist in Stripe, clear it from database
        console.log('Error retrieving subscription:', error.message);
        if (error.code === 'resource_missing') {
          await storage.updateUserStripeInfo(user.id, user.stripeCustomerId || '', null);
          console.log(`Cleared invalid subscription ID for user ${user.id}`);
        } else {
          throw error; // Re-throw other errors
        }
      }
    }
    
    if (!user.email) {
      return res.status(400).json({ message: 'No user email on file' });
    }

    try {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      });

      user = await storage.updateUserStripeInfo(user.id, customer.id);

      // Create product first, then subscription
      const product = await stripe.products.create({
        name: 'ScrapeFlow Credits Pack',
        description: '50 Instagram scraping requests per month',
      });

      // Create price for 50 credits at 5€
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price_data: {
            currency: 'eur',
            product: product.id,
            unit_amount: 500, // 5€ in cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserStripeInfo(user.id, customer.id, subscription.id);
      
      let clientSecret = (subscription.latest_invoice as any)?.payment_intent?.client_secret;
      
      // If no payment intent, create one manually
      if (!clientSecret && subscription.latest_invoice) {
        console.log('No payment intent found, creating one manually');
        const paymentIntent = await stripe.paymentIntents.create({
          amount: 500, // 5€ in cents
          currency: 'eur',
          customer: customer.id,
          metadata: {
            subscription_id: subscription.id,
            credits: '50',
          },
        });
        clientSecret = paymentIntent.client_secret;
        console.log('Manual payment intent created:', paymentIntent.id);
      }
      
      console.log('Subscription created:', {
        subscriptionId: subscription.id,
        clientSecret: !!clientSecret,
        latestInvoice: !!subscription.latest_invoice,
        paymentIntent: !!(subscription.latest_invoice as any)?.payment_intent,
      });
  
      // Check if payment was successful and add credits
      if (clientSecret) {
        // Extract payment intent ID from client secret
        const paymentIntentId = clientSecret.split('_secret_')[0];
        console.log('Checking payment intent:', paymentIntentId);
        
        // Check payment status after a short delay to ensure it's processed
        setTimeout(async () => {
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            console.log('Payment intent status:', paymentIntent.status);
            
            if (paymentIntent.status === 'succeeded') {
              console.log('Payment succeeded, adding 50 credits to user:', userId);
              await storage.createCreditTransaction({
                userId,
                amount: 50,
                type: 'purchase',
                description: 'Abonnement - 50 crédits (5€)'
              });
              
              // Update user credits
              const currentUser = await storage.getUser(userId);
              const newCreditBalance = (currentUser?.credits || 0) + 50;
              await storage.updateUserCredits(userId, newCreditBalance);
              
              console.log(`Credits updated: ${currentUser?.credits || 0} -> ${newCreditBalance}`);
            }
          } catch (error) {
            console.error('Error checking payment status:', error);
          }
        }, 3000); // 3 second delay
      }
      
      res.send({
        subscriptionId: subscription.id,
        clientSecret: clientSecret,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      return res.status(400).send({ error: { message: error.message } });
    }
  });

  // Stripe webhook for handling successful payments
  app.post('/api/stripe-webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig as string, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as any;
      const customerId = invoice.customer;
      
      // Find user by Stripe customer ID
      const users_list = await storage.getCreditTransactionsByUser(''); // This is a workaround
      // In a real implementation, you'd need a method to find user by stripe customer ID
      
      // Add 50 credits and create transaction
      // This would need proper implementation based on your database structure
    }

    res.json({received: true});
  });

  // Stats route
  app.get('/api/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaigns = await storage.getCampaignsByUser(userId);
      const user = await storage.getUser(userId);
      const transactions = await storage.getCreditTransactionsByUser(userId);
      
      const activeCampaigns = campaigns.filter(c => c.status === 'running').length;
      const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
      
      // Calculate used credits from transactions (usage minus refunds)
      const usage = transactions
        .filter(t => t.type === 'usage')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const refunds = transactions
        .filter(t => t.type === 'refund')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const usedCredits = Math.max(0, usage - refunds);
      
      // Calculate total credits: all purchases + initial credits
      const purchases = transactions
        .filter(t => t.type === 'purchase')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      // Initial credits (credits the user had before any transactions)
      // This would be the credits they had when they first signed up
      const remainingCredits = user?.credits || 0;
      const totalCredits = Math.max(remainingCredits + usedCredits, purchases);

      res.json({
        activeCampaigns,
        completedCampaigns,
        usedCredits,
        totalCredits,
        remainingCredits,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
