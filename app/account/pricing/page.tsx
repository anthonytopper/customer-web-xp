"use client";
import PricingCardStripe from "@/components/ecom/PricingCardStripe";
import { redirect } from "next/navigation";
import { Suspense } from "react";
function PricingContent() {
    const handlePlanSelect = (planId: string, priceId: string) => {
        const params = {
            // redirect: "true",
            priceId: priceId,
        };
        const paramsString = new URLSearchParams(params).toString();
        const returnTo = `/account/checkout?${paramsString}`;
        return redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
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
      <PricingContent />
    </Suspense>
  );
}
