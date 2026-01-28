"use client";

import { useRouter } from "next/navigation";

export default function UpgradeButton() {
  const router = useRouter();

  const handleCheckout = () => {
    router.push("/account/checkout");
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <h2 className="text-2xl font-semibold leading-8 tracking-tight text-gray-900 dark:text-zinc-50">
        Subscription
      </h2>
      <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
        Upgrade to access premium features and unlock the full experience.
      </p>

      <button
        onClick={handleCheckout}
        className="flex h-12 w-full items-center justify-center rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50 disabled:cursor-not-allowed md:w-[200px]"
      >
        Upgrade
      </button>
    </div>
  );
}
