"use client";

import {
  BillingPlan,
  BillingPlanId,
  BillingPeriod,
  getAnnualMonthlyEquivalent,
  getPlanPrice,
} from "@/lib/billing";

interface PlanCardProps {
  plan: BillingPlan;
  billingPeriod: BillingPeriod;
  isLoading: boolean;
  onSubscribe: (planId: BillingPlanId) => void;
}

export function PlanCard({
  plan,
  billingPeriod,
  isLoading,
  onSubscribe,
}: PlanCardProps) {
  const price = getPlanPrice(plan.id, billingPeriod);
  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
      <div className="mt-2">
        <span className="text-3xl font-bold text-gray-900">${price}</span>
        <span className="text-gray-500">
          /{billingPeriod === "monthly" ? "mo" : "yr"}
        </span>
        {billingPeriod === "annual" && (
          <p className="text-sm text-green-600 mt-1">
            ${getAnnualMonthlyEquivalent(plan.annualPrice)}/mo billed annually
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
        onClick={() => onSubscribe(plan.id)}
        disabled={isLoading}
        className="mt-6 w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {isLoading ? "Loading..." : `Subscribe to ${plan.name}`}
      </button>
    </div>
  );
}
