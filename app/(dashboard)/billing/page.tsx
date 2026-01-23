import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveSubscription, getUsageStats } from "@/lib/subscription";
import { BillingClient } from "./billing-client";

export default async function BillingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const subscription = await getActiveSubscription(session.user.id);
  const usage = await getUsageStats(session.user.id);

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Billing</h1>

      <BillingClient
        subscription={
          subscription
            ? {
                id: subscription.id,
                plan: subscription.plan,
                status: subscription.status,
                currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
              }
            : null
        }
        usage={{
          count: usage.count,
          limit: usage.limit,
          plan: usage.plan,
        }}
      />
    </div>
  );
}
