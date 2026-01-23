import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
});

// Price IDs from environment
export const PRICE_IDS = {
  PRO_MONTHLY: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
  PRO_ANNUAL: process.env.STRIPE_PRO_ANNUAL_PRICE_ID!,
  BUSINESS_MONTHLY: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID!,
  BUSINESS_ANNUAL: process.env.STRIPE_BUSINESS_ANNUAL_PRICE_ID!,
} as const;

// Map price IDs to plan names
export function getPlanFromPriceId(priceId: string): "pro" | "business" | null {
  if (
    priceId === PRICE_IDS.PRO_MONTHLY ||
    priceId === PRICE_IDS.PRO_ANNUAL
  ) {
    return "pro";
  }
  if (
    priceId === PRICE_IDS.BUSINESS_MONTHLY ||
    priceId === PRICE_IDS.BUSINESS_ANNUAL
  ) {
    return "business";
  }
  return null;
}

// Get price ID from plan and billing period
export function getPriceId(
  plan: "pro" | "business",
  period: "monthly" | "annual"
): string {
  if (plan === "pro") {
    return period === "monthly" ? PRICE_IDS.PRO_MONTHLY : PRICE_IDS.PRO_ANNUAL;
  }
  return period === "monthly"
    ? PRICE_IDS.BUSINESS_MONTHLY
    : PRICE_IDS.BUSINESS_ANNUAL;
}
