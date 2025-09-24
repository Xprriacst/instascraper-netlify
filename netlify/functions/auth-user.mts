import type { Context, Config } from "@netlify/functions";
import { storage } from "../../server/storage";
import { requireAuth } from "../../server/netlifyAuth";

export default requireAuth(async (req: Request, context: Context, user: any) => {
  try {
    const userId = user.claims.sub;
    const userData = await storage.getUser(userId);
    
    if (!userData) {
      return new Response(JSON.stringify({ message: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(userData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error fetching user:", error);
    return new Response(JSON.stringify({ message: "Failed to fetch user" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

export const config: Config = {
  path: "/api/auth/user"
};
