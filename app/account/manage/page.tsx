import SubscriptionManage from "@/components/ecom/SubscriptionManage";
import UpgradeButton from "@/components/ecom/UpgradeButton";
import { auth0 } from "@/lib/auth/auth0";
import { getMe } from "@/lib/api/user";
import { redirect } from "next/navigation";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_API_KEY || "", {
  apiVersion: "2025-12-15.clover",
});

export default async function ManagePage() {
  const session = await auth0.getSession();
  if (!session) {
    return redirect("/login");
  }

  const user = await getMe(session);

  if (!user) {
    return redirect("/login");
  }

  let isSubscribed = false;

  if (user.stripe_customer_id) {
    const stripeCustomer = await stripe.customers.retrieve(user.stripe_customer_id);
    if (stripeCustomer.deleted) {
      isSubscribed = false;
    } else {
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripe_customer_id,
      });
      isSubscribed = subscriptions.data.length > 0;
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex w-full flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            My Account
          </h1>
          {/* User Name Section */}
          {user?.name && (
            <div className="w-full">
              <h2 className="text-xl leading-8 tracking-tight text-gray-500 dark:text-zinc-50">
                {user.name}
              </h2>
            </div>
          )}

          {/* Divider */}
          <div className="w-full border-t border-zinc-200 dark:border-zinc-800 my-2"></div>

          {/* Subscription Management Section */}
          {isSubscribed ? 
              <SubscriptionManage />
            :
              <UpgradeButton />
          }
        </div>
      </main>
    </div>
  );
}