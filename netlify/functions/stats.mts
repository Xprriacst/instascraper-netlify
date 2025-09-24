import type { Context, Config } from "@netlify/functions";
import { storage } from "../../server/storage";
import { requireAuth } from "../../server/netlifyAuth";

export default requireAuth(async (req: Request, context: Context, user: any) => {
  try {
    const userId = user.claims.sub;
    const campaigns = await storage.getCampaignsByUser(userId);
    const userData = await storage.getUser(userId);
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
    
    const remainingCredits = userData?.credits || 0;
    const totalCredits = Math.max(remainingCredits + usedCredits, purchases);

    return new Response(JSON.stringify({
      activeCampaigns,
      completedCampaigns,
      usedCredits,
      totalCredits,
      remainingCredits,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error fetching stats:", error);
    return new Response(JSON.stringify({ message: "Failed to fetch stats" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

export const config: Config = {
  path: "/api/stats"
};
