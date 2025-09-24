import type { Context, Config } from "@netlify/functions";
import Stripe from "stripe";
import { storage } from "../../server/storage";
import { requireAuth } from "../../server/netlifyAuth";

const stripe = new Stripe(Netlify.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: "2025-08-27.basil",
});

export default requireAuth(async (req: Request, context: Context, user: any) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const userId = user.claims.sub;
    let userData = await storage.getUser(userId);

    if (!userData) {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (userData.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(userData.stripeSubscriptionId, {
          expand: ['latest_invoice.payment_intent'],
        });

        const clientSecret = (subscription.latest_invoice as any)?.payment_intent?.client_secret;
        
        if (!clientSecret || subscription.status !== 'active') {
          await storage.updateUserStripeInfo(userData.id, userData.stripeCustomerId || '', null);
        } else {
          return new Response(JSON.stringify({
            subscriptionId: subscription.id,
            clientSecret: clientSecret,
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (error: any) {
        if (error.code === 'resource_missing') {
          await storage.updateUserStripeInfo(userData.id, userData.stripeCustomerId || '', null);
        } else {
          throw error;
        }
      }
    }
    
    if (!userData.email) {
      return new Response(JSON.stringify({ message: 'No user email on file' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const customer = await stripe.customers.create({
      email: userData.email,
      name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
    });

    userData = await storage.updateUserStripeInfo(userData.id, customer.id);

    const product = await stripe.products.create({
      name: 'ScrapeFlow Credits Pack',
      description: '50 Instagram scraping requests per month',
    });

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

    await storage.updateUserStripeInfo(userData.id, customer.id, subscription.id);
    
    let clientSecret = (subscription.latest_invoice as any)?.payment_intent?.client_secret;
    
    if (!clientSecret && subscription.latest_invoice) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 500,
        currency: 'eur',
        customer: customer.id,
        metadata: {
          subscription_id: subscription.id,
          credits: '50',
        },
      });
      clientSecret = paymentIntent.client_secret;
    }
    
    return new Response(JSON.stringify({
      subscriptionId: subscription.id,
      clientSecret: clientSecret,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("Error creating subscription:", error);
    return new Response(JSON.stringify({ error: { message: error.message } }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

export const config: Config = {
  path: "/api/create-subscription"
};
