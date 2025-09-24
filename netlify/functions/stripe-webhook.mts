import type { Context, Config } from "@netlify/functions";
import Stripe from "stripe";
import { storage } from "../../server/storage";

const stripe = new Stripe(Netlify.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: "2025-08-27.basil",
});

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const sig = req.headers.get('stripe-signature');
    const body = await req.text();
    
    if (!sig) {
      return new Response(JSON.stringify({ message: 'No signature provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, Netlify.env.get('STRIPE_WEBHOOK_SECRET') || '');
    } catch (err: any) {
      console.log(`Webhook signature verification failed.`, err.message);
      return new Response(JSON.stringify({ message: `Webhook Error: ${err.message}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as any;
      const customerId = invoice.customer;
      
      // Find user by Stripe customer ID
      // Note: You'll need to implement getUserByStripeCustomerId in storage
      try {
        const user = await storage.getUserByStripeCustomerId(customerId);
        if (user) {
          // Add 50 credits
          await storage.createCreditTransaction({
            userId: user.id,
            amount: 50,
            type: 'purchase',
            description: 'Abonnement - 50 crédits (5€)'
          });
          
          const newCreditBalance = (user.credits || 0) + 50;
          await storage.updateUserCredits(user.id, newCreditBalance);
        }
      } catch (error) {
        console.error('Error processing webhook:', error);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ message: 'Webhook processing failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config: Config = {
  path: "/api/stripe-webhook"
};
