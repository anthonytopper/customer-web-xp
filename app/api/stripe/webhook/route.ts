import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_API_KEY || "", {
  apiVersion: "2025-12-15.clover",
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  if (!process.env.STRIPE_API_KEY) {
    return NextResponse.json(
      { error: "STRIPE_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  // Handle subscription status updates
  if (event.type.startsWith("customer.subscription")) {
    const subscription = event.data.object as Stripe.Subscription & {
      current_period_start?: number;
      current_period_end?: number;
      canceled_at?: number | null;
      cancel_at_period_end?: boolean;
    };

    const customer = typeof subscription.customer === 'string' ? 
        await stripe.customers.retrieve(subscription.customer) 
      : 
        subscription.customer;
    
    const result = {
      type: event.type,
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      customer,
      auth0Sub: (customer as Stripe.Customer)?.metadata?.auth0Sub,
      status: subscription.status,
      ...(subscription.current_period_start && {
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
      }),
      ...(subscription.current_period_end && {
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      }),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      ...(subscription.canceled_at && {
        canceledAt: new Date(subscription.canceled_at * 1000),
      }),
    };
    
    console.log("Subscription status update result:", result);
  }

  return NextResponse.json({ received: true });
}

