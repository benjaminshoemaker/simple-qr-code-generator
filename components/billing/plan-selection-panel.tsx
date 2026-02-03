"use client";

import { PlanCard } from "@/components/billing/plan-card";
import { BillingPeriod, BillingPlanId, PLANS } from "@/lib/billing";

interface PlanSelectionPanelProps {
  billingPeriod: BillingPeriod;
  loading: string | null;
  usageCount: number;
  onBillingPeriodChange: (period: BillingPeriod) => void;
  onSubscribe: (planId: BillingPlanId) => void;
}

export function PlanSelectionPanel({
  billingPeriod,
  loading,
  usageCount,
  onBillingPeriodChange,
  onSubscribe,
}: PlanSelectionPanelProps) {
  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Choose a Plan
        </h2>
        <p className="text-gray-600 mb-6">
          Subscribe to create dynamic QR codes that you can edit anytime.
        </p>

        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={() => onBillingPeriodChange("monthly")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              billingPeriod === "monthly"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => onBillingPeriodChange("annual")}
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

        <div className="grid md:grid-cols-2 gap-6">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              billingPeriod={billingPeriod}
              isLoading={loading === plan.id}
              onSubscribe={onSubscribe}
            />
          ))}
        </div>
      </div>

      {usageCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            You have {usageCount} QR code{usageCount !== 1 ? "s" : ""} created.
            Subscribe to manage and track them.
          </p>
        </div>
      )}
    </>
  );
}
