import type { Context, Config } from "@netlify/functions";
import { storage } from "../../server/storage";
import { requireAuth } from "../../server/netlifyAuth";
import { apifyService } from "../../server/services/apifyService";
import { insertCampaignSchema } from "../../shared/schema";

export default async (req: Request, context: Context) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      }
    });
  }

  if (req.method === 'GET') {
    return requireAuth(async (req: Request, context: Context, user: any) => {
      try {
        const userId = user.claims.sub;
        const campaigns = await storage.getCampaignsByUser(userId);
        
        return new Response(JSON.stringify(campaigns), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error("Error fetching campaigns:", error);
        return new Response(JSON.stringify({ message: "Failed to fetch campaigns" }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    })(req, context);
  }

  if (req.method === 'POST') {
    return requireAuth(async (req: Request, context: Context, user: any) => {
      try {
        const userId = user.claims.sub;
        const userData = await storage.getUser(userId);
        
        if (!userData) {
          return new Response(JSON.stringify({ message: "User not found" }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const body = await req.json();
        const validatedData = insertCampaignSchema.parse(body);

        // Check if user has enough credits
        const userCredits = userData.credits || 0;
        if (userCredits < validatedData.requestCount) {
          return new Response(JSON.stringify({ message: "Insufficient credits" }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
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

          return new Response(JSON.stringify({ ...campaign, apifyRunId: runId, status: 'running' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
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
          
          return new Response(JSON.stringify({ message: "Failed to start scraping campaign" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (error) {
        console.error("Error creating campaign:", error);
        return new Response(JSON.stringify({ message: "Failed to create campaign" }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    })(req, context);
  }

  return new Response(JSON.stringify({ message: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const config: Config = {
  path: "/api/campaigns"
};
