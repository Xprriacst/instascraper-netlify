import { Context } from "@netlify/functions";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  credits: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    claims: {
      sub: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
  };
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export function extractUserFromRequest(request: Request): any {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization header');
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  return {
    claims: {
      sub: decoded.sub,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
    }
  };
}

export function requireAuth(handler: (request: Request, context: Context, user: any) => Promise<Response>) {
  return async (request: Request, context: Context): Promise<Response> => {
    try {
      const user = extractUserFromRequest(request);
      return await handler(request, context, user);
    } catch (error) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
}
