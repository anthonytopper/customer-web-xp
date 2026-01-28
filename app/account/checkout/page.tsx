"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PricingCardStripe from "@/components/ecom/PricingCardStripe";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");

    if (success === "true") {
      router.push("/home/articles");
    } else if (canceled) {
      alert("Payment was canceled.");
    }
  }, [searchParams, router]);

  const handleCheckout = async (priceId: string) => {
    try {
      const response = await fetch("/api/stripe/checkout/public", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Checkout error:", data);
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert(
        error instanceof Error ? error.message : "An error occurred during checkout"
      );
    }
  };

  const handlePlanSelect = (planId: string, priceId: string) => {
    // Skip checkout for free plans
    if (priceId && priceId !== 'free') {
      handleCheckout(priceId);
    }
  };
  
  return (
    <PricingCardStripe onSelectPlan={(planId, priceId) => {
      handlePlanSelect(planId, priceId);
    }} />
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}

