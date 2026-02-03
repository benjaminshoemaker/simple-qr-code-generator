"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { BillingStatusBanner } from "@/components/billing/billing-status-banner";
import { CurrentPlanPanel } from "@/components/billing/current-plan-panel";
import { PlanSelectionPanel } from "@/components/billing/plan-selection-panel";
import { BillingPeriod, BillingPlanId } from "@/lib/billing";

interface BillingClientProps {
  subscription: {
    id: string;
    plan: "pro" | "business";
    status: string;
    currentPeriodEnd: string;
  } | null;
  usage: {
    count: number;
    limit: number | null;
    plan: "pro" | "business" | null;
  };
}

export function BillingClient({ subscription, usage }: BillingClientProps) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");

  const success = searchParams.get("success") === "true";
  const canceled = searchParams.get("canceled") === "true";

  const handleSubscribe = async (plan: BillingPlanId) => {
    setLoading(plan);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, period: billingPeriod }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoading("portal");
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to open customer portal");
      }
    } catch (error) {
      console.error("Portal error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      <BillingStatusBanner success={success} canceled={canceled} />

      {subscription ? (
        <CurrentPlanPanel
          subscription={subscription}
          usage={usage}
          loading={loading}
          onManageSubscription={handleManageSubscription}
          onUpgrade={() => handleSubscribe("business")}
        />
      ) : (
        <PlanSelectionPanel
          billingPeriod={billingPeriod}
          loading={loading}
          usageCount={usage.count}
          onBillingPeriodChange={setBillingPeriod}
          onSubscribe={handleSubscribe}
        />
      )}
    </div>
  );
}
