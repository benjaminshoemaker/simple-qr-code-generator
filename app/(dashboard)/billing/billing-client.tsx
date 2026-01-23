"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

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

const PLANS = [
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 5,
    annualPrice: 36,
    features: [
      "Up to 10 dynamic QR codes",
      "Scan analytics",
      "Edit destination URLs anytime",
      "Folders for organization",
    ],
  },
  {
    id: "business",
    name: "Business",
    monthlyPrice: 15,
    annualPrice: 120,
    features: [
      "Unlimited dynamic QR codes",
      "Advanced analytics",
      "CSV export",
      "Priority support",
      "Custom branding (coming soon)",
    ],
  },
] as const;

export function BillingClient({ subscription, usage }: BillingClientProps) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">(
    "monthly"
  );

  const success = searchParams.get("success") === "true";
  const canceled = searchParams.get("canceled") === "true";

  const handleSubscribe = async (plan: "pro" | "business") => {
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
      {/* Success/Cancel Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">
            Thank you for subscribing! Your subscription is now active.
          </p>
        </div>
      )}
      {canceled && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Checkout was canceled. You can try again when you&apos;re ready.
          </p>
        </div>
      )}

      {/* Current Plan */}
      {subscription ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Current Plan
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 capitalize">
                {subscription.plan}
              </p>
              <p className="text-sm text-gray-500">
                Status:{" "}
                <span
                  className={
                    subscription.status === "active"
                      ? "text-green-600"
                      : "text-yellow-600"
                  }
                >
                  {subscription.status}
                </span>
              </p>
              <p className="text-sm text-gray-500">
                Renews:{" "}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={handleManageSubscription}
              disabled={loading === "portal"}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading === "portal" ? "Loading..." : "Manage Subscription"}
            </button>
          </div>

          {/* Usage */}
          {usage.limit && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Usage</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min((usage.count / usage.limit) * 100, 100)}%`,
                    }}
                  />
                </div>
                <span className="text-sm text-gray-600">
                  {usage.count} / {usage.limit} QR codes
                </span>
              </div>
              {usage.count >= usage.limit && (
                <p className="mt-2 text-sm text-orange-600">
                  You&apos;ve reached your limit. Upgrade to Business for unlimited
                  codes.
                </p>
              )}
            </div>
          )}

          {/* Upgrade prompt for Pro users */}
          {subscription.plan === "pro" && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">
                Need more? Upgrade to Business for unlimited QR codes.
              </p>
              <button
                onClick={() => handleSubscribe("business")}
                disabled={loading === "business"}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading === "business" ? "Loading..." : "Upgrade to Business"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* No subscription - show plans */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Choose a Plan
            </h2>
            <p className="text-gray-600 mb-6">
              Subscribe to create dynamic QR codes that you can edit anytime.
            </p>

            {/* Billing period toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  billingPeriod === "monthly"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod("annual")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  billingPeriod === "annual"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Annual
                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  Save up to 40%
                </span>
              </button>
            </div>

            {/* Plan cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
                >
                  <h3 className="text-xl font-bold text-gray-900">
                    {plan.name}
                  </h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">
                      $
                      {billingPeriod === "monthly"
                        ? plan.monthlyPrice
                        : plan.annualPrice}
                    </span>
                    <span className="text-gray-500">
                      /{billingPeriod === "monthly" ? "mo" : "yr"}
                    </span>
                    {billingPeriod === "annual" && (
                      <p className="text-sm text-green-600 mt-1">
                        ${(plan.annualPrice / 12).toFixed(0)}/mo billed annually
                      </p>
                    )}
                  </div>

                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-gray-600"
                      >
                        <svg
                          className="w-5 h-5 text-green-500 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loading === plan.id}
                    className="mt-6 w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {loading === plan.id ? "Loading..." : `Subscribe to ${plan.name}`}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Existing QR codes notice */}
          {usage.count > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                You have {usage.count} QR code{usage.count !== 1 ? "s" : ""}{" "}
                created. Subscribe to manage and track them.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
