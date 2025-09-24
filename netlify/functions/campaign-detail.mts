import type { Context, Config } from "@netlify/functions";
import { storage } from "../../server/storage";
import { requireAuth } from "../../server/netlifyAuth";

export default requireAuth(async (req: Request, context: Context, user: any) => {
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const campaignId = pathParts[pathParts.length - 1];

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

    return new Response(JSON.stringify(campaign), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error fetching campaign:", error);
    return new Response(JSON.stringify({ message: "Failed to fetch campaign" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

export const config: Config = {
  path: "/api/campaigns/*"
};
