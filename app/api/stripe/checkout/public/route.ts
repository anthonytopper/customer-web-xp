import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_API_KEY || "", {
  apiVersion: "2025-12-15.clover",
});

export async function POST(request: NextRequest) {
  try {
    const { priceId, email } = await request.json();
    
    // Check for confirm_ios query parameter
    const { searchParams } = new URL(request.url);
    const confirmIos = searchParams.get("confirm_ios");

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
    
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [
        {
          price: finalPriceId,
          quantity: 1,
        },
      ],
      ...(email && { customer_email: email }),
      success_url: `${request.headers.get("origin") || ""}/account/checkout?success=true`,
      cancel_url: `${request.headers.get("origin") || ""}/account/checkout?canceled=true`,
    };

    // Add custom field if confirm_ios query parameter is present
    if (confirmIos) {
      sessionConfig.custom_fields = [
        {
          key: "confirm_ios",
          label: {
            type: "custom",
            custom: "Rebind is only on iOS: confirm I use an iOS device",
          },
          type: "dropdown",
          optional: false,
          dropdown: {
            options: [
              {
                label: "Yes, I use an iOS device",
                value: "yes",
              },
            ],
          },
        },
      ];
    }
    
    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
