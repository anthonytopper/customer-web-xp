"use client";

import { useState } from "react";

export default function SubscriptionManage() {

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
  
    const handleManageSubscription = async () => {
      setLoading(true);
      setMessage(null);
  
      try {
        const response = await fetch("/api/stripe/portal", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
  
        const data = await response.json();
  
        if (!response.ok) {
          console.error("Portal error:", data);
          throw new Error(data.error || "Failed to create portal session");
        }
  
        if (data.url) {
          // Redirect to Stripe Customer Portal
          window.location.href = data.url;
        } else {
          throw new Error("No portal URL received");
        }
      } catch (error) {
        console.error("Portal error:", error);
        setMessage(
          error instanceof Error ? error.message : "An error occurred while accessing the portal"
        );
        setLoading(false);
      }
    };

    return (
        <div className="w-full flex flex-col gap-6">

            <h2 className="text-2xl font-semibold leading-8 tracking-tight text-gray-900 dark:text-zinc-50">
              Subscription
            </h2>
            <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              Update your payment method, view billing history, or cancel your subscription.
            </p>

            {message && (
              <div
                className={`w-full rounded-lg p-4 ${
                  message.includes("No Stripe customer")
                    ? "bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                    : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                }`}
              >
                {message}
              </div>
            )}

            <button
              onClick={handleManageSubscription}
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50 disabled:cursor-not-allowed md:w-[200px]"
            >
              {loading ? "Loading..." : "Manage Subscription"}
            </button>
        </div>
    );
}