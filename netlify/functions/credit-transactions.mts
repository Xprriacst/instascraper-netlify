import type { Context, Config } from "@netlify/functions";
import { storage } from "../../server/storage";
import { requireAuth } from "../../server/netlifyAuth";

export default requireAuth(async (req: Request, context: Context, user: any) => {
  try {
    const userId = user.claims.sub;
    const transactions = await storage.getCreditTransactionsByUser(userId);
    
    return new Response(JSON.stringify(transactions), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error fetching credit transactions:", error);
    return new Response(JSON.stringify({ message: "Failed to fetch credit transactions" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

export const config: Config = {
  path: "/api/credits/transactions"
};
