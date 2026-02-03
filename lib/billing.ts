export const PLANS = [
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

export type BillingPlan = (typeof PLANS)[number];
export type BillingPlanId = BillingPlan["id"];
export type BillingPeriod = "monthly" | "annual";

export function getPlanById(planId: BillingPlanId): BillingPlan {
  const plan = PLANS.find((item) => item.id === planId);
  if (!plan) {
    throw new Error(`Unknown plan: ${planId}`);
  }
  return plan;
}

export function getPlanPrice(
  planId: BillingPlanId,
  period: BillingPeriod
): number {
  const plan = getPlanById(planId);
  return period === "monthly" ? plan.monthlyPrice : plan.annualPrice;
}

export function getAnnualMonthlyEquivalent(annualPrice: number): string {
  return (annualPrice / 12).toFixed(0);
}
