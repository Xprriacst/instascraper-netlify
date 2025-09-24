import type { Context, Config } from "@netlify/functions";
import { storage } from "../../server/storage";
import { requireAuth } from "../../server/netlifyAuth";
import { apifyService } from "../../server/services/apifyService";

export default requireAuth(async (req: Request, context: Context, user: any) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const campaignId = pathParts[pathParts.indexOf('campaigns') + 1];

    if (!campaignId) {
      return new Response(JSON.stringify({ message: "Campaign ID is required" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userId = user.claims.sub;
    const campaign = await storage.getCampaign(campaignId);
    
    if (!campaign || campaign.userId !== userId) {
      return new Response(JSON.stringify({ message: "Campaign not found" }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!campaign.apifyRunId) {
      return new Response(JSON.stringify({ message: "No Apify run ID found" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
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

      return new Response(JSON.stringify({ 
        status: 'completed', 
        completedRequests: results.length,
        totalResults: results.length 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else if (status === 'FAILED' || status === 'ABORTED') {
      await storage.updateCampaign(campaign.id, { status: 'failed' });
      return new Response(JSON.stringify({ status: 'failed' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ status: status.toLowerCase() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error checking campaign status:", error);
    return new Response(JSON.stringify({ message: "Failed to check campaign status" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

export const config: Config = {
  path: "/api/campaigns/*/check-status"
};
