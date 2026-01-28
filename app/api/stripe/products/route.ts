import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_API_KEY || "", {
  apiVersion: "2025-12-15.clover",
});

export interface StripeProductPrice {
  id: string;
  unit_amount: number | null;
  currency: string;
  recurring: {
    interval: "month" | "year";
    interval_count: number;
  } | null;
  metadata?: Record<string, string>;
}

export interface StripeProduct {
  id: string;
  name: string;
  description: string | null;
  metadata?: Record<string, string>;
  prices: StripeProductPrice[];
}

export async function GET(request: NextRequest) {
  try {
    if (!process.env.STRIPE_API_KEY) {
      return NextResponse.json(
        { error: "STRIPE_API_KEY is not configured" },
        { status: 500 }
      );
    }

    // Fetch all active products
    const products = await stripe.products.list({
      active: true,
      limit: 100,
    });

    // For each product, fetch its active prices
    const productsWithPrices: StripeProduct[] = await Promise.all(
      products.data.map(async (product) => {
        const prices = await stripe.prices.list({
          product: product.id,
          active: true,
          limit: 100,
        });

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          metadata: product.metadata,
          prices: prices.data.map((price) => ({
            id: price.id,
            unit_amount: price.unit_amount,
            currency: price.currency,
            recurring: price.recurring
              ? {
                  interval: price.recurring.interval as "month" | "year",
                  interval_count: price.recurring.interval_count,
                }
              : null,
            metadata: price.metadata,
          })),
        };
      })
    );

    // Filter out products that don't have any prices
    const validProducts = productsWithPrices.filter(
      (product) => product.prices.length > 0
    );

    return NextResponse.json({ products: validProducts });
  } catch (error) {
    console.error("Error fetching Stripe products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
