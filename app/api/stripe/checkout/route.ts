import { getMe, updateMe } from "@/lib/api/user";
import { auth0 } from "@/lib/auth/auth0";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_API_KEY || "", {
  apiVersion: "2025-12-15.clover",
});

export async function POST(request: NextRequest) {
  try {
    const authSession = await auth0.getSession();
    if (!authSession) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    const user = authSession.user;
    const { priceId } = await request.json();

    if (!process.env.STRIPE_API_KEY) {
      return NextResponse.json(
        { error: "STRIPE_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const productId = process.env.STRIPE_PRODUCT_DEFAULT;
    if (!productId) {
      return NextResponse.json(
        { error: "STRIPE_PRODUCT_DEFAULT is not configured" },
        { status: 500 }
      );
    }

    // Create checkout session
    // If priceId is provided, use it directly; otherwise fetch the default product's price
    let finalPriceId = priceId;
    if (!finalPriceId) {
      const prices = await stripe.prices.list({
        product: productId,
        active: true,
        limit: 1,
      });
      if (prices.data.length > 0) {
        finalPriceId = prices.data[0].id;
      } else {
        return NextResponse.json(
          { error: "No active price found for the default product" },
          { status: 500 }
        );
      }
    }
    let customer : Stripe.Customer | Stripe.DeletedCustomer | null = null;
    const me = await getMe(authSession);
    if (!me) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (me.stripe_customer_id) {
      try {
        customer = await stripe.customers.retrieve(me.stripe_customer_id);
      } catch (error) {
        console.error("Error retrieving customer:", error);
        customer = null;
      }
    }
    
    if (!customer) {
      try {
        customer = await stripe.customers.create({
            metadata: {
              auth0Sub: user.sub,
            },
            email: user.email,
            name: user.name,
        });
      } catch (error) {
        console.error("Error creating customer:", error);
        return NextResponse.json(
          { error: "Failed to create customer" },
          { status: 500 }
        );
      }
    }
    await updateMe(authSession, { stripe_customer_id: customer.id });
    
    // Check for existing active subscriptions
    if (!customer.deleted) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: "all",
        limit: 100,
      });

      // Check for active, trialing, or past_due subscriptions
      const activeSubscriptions = subscriptions.data.filter(
        (sub) => 
          sub.status === "active" || 
          sub.status === "trialing" || 
          sub.status === "past_due"
      );

      if (activeSubscriptions.length > 0) {
        return NextResponse.json(
          { error: "You already have an active subscription" },
          { status: 400 }
        );
      }
    }
    
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: finalPriceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.sub,
      },
      customer: customer.id,
      success_url: `${request.headers.get("origin") || ""}/account/checkout?success=true`,
      cancel_url: `${request.headers.get("origin") || ""}/account/checkout?canceled=true`,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

