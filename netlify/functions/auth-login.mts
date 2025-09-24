import type { Context, Config } from "@netlify/functions";
import { storage } from "../../server/storage";
import { generateToken } from "../../server/netlifyAuth";

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ message: 'Email and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // For demo purposes, we'll create a simple authentication
    // In production, you'd verify against a real user database
    let user = await storage.getUserByEmail(email);
    
    if (!user) {
      // Create a new user if doesn't exist (simplified for demo)
      user = await storage.createUser({
        email,
        firstName: email.split('@')[0],
        lastName: '',
        credits: 10, // Give 10 free credits to new users
      });
    }

    const token = generateToken(user);

    return new Response(JSON.stringify({ 
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        credits: user.credits
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config: Config = {
  path: "/api/auth/login"
};
