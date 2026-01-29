"use client";

import { Suspense, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PricingCardStripe from "@/components/ecom/PricingCardStripe";
import { isIOS } from "@/lib/util/browser";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleSuccess = useCallback(() => {
    // router.push("/home/articles");

    window.location.href = "https://apps.apple.com/us/app/rebind-study-bible/id6751198660"
  }, [router]);

  const handleCheckout = useCallback(async (priceId: string) => {
    const shouldConfirmIos = !isIOS();
    const flow = searchParams.get("flow");
    const apiEndpoint = flow === "email" ? "/api/stripe/checkout/public" : "/api/stripe/checkout";
    
    try {
      const response = await fetch(`${apiEndpoint}?confirm_ios=${shouldConfirmIos}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        // If user already has an active subscription, treat as success
        if (data.code === "ALREADY_SUBSCRIBED") {
          handleSuccess();
          return;
        }
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
  }, [handleSuccess, searchParams]);

  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    const redirect = searchParams.get("redirect");
    const priceId = searchParams.get("priceId");

    if (success === "true") {
      // Try to open the iOS app if available
      if (isIOS()) {
        try {
          window.location.href = "rebind://";
          // Give the app a moment to open, then redirect if it didn't
          setTimeout(() => {
            handleSuccess();
          }, 500);
        } catch (error) {
          console.error("Failed to open rebind://", error);
          handleSuccess();
        }
      } else {
        handleSuccess();
      }
    } else if (canceled) {
      alert("Payment was canceled.");
    } else if (priceId) {
      handleCheckout(priceId);
    }
  }, [searchParams, router, handleCheckout]);

  const handlePlanSelect = (planId: string, priceId: string) => {
    // Skip checkout for free plans
    if (priceId && priceId !== 'free') {
      handleCheckout(priceId);
    }
  };

  if (searchParams.get("success") === "true") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-16">
        <div className="text-center">
          <p className="text-lg text-gray-600">Payment successful</p>
        </div>
      </div>
    );
  }
  
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

