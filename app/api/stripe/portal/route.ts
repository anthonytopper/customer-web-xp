import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth0 } from "@/lib/auth/auth0";
import { getMe } from "@/lib/api/user";

const stripe = new Stripe(process.env.STRIPE_API_KEY || "", {
  apiVersion: "2025-12-15.clover",
});

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_API_KEY) {
      return NextResponse.json(
        { error: "STRIPE_API_KEY is not configured" },
        { status: 500 }
      );
    }

    // Get the authenticated user's session
    const session = await auth0.getSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const me = await getMe(session);
    if (!me) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (!me.stripe_customer_id) {
      return NextResponse.json(
        { error: "No Stripe customer found for this user" },
        { status: 404 }
      );
    }

    const customerId = me.stripe_customer_id

    // Create a customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${request.headers.get("origin") || ""}/account/manage`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Error creating portal session:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}

