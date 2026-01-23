import { db } from "@/lib/db";
import { subscriptions, qrCodes } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";

// Plan limits
const PLAN_LIMITS = {
  pro: 10,
  business: Infinity,
} as const;

export type Plan = "pro" | "business";
export type SubscriptionStatus = "active" | "past_due" | "canceled";

export interface ActiveSubscription {
  id: string;
  plan: Plan;
  status: SubscriptionStatus;
  currentPeriodEnd: Date;
}

/**
 * Get the user's active subscription, if any
 */
export async function getActiveSubscription(
  userId: string
): Promise<ActiveSubscription | null> {
  const subscription = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.status, "active")
    ),
  });

  if (!subscription) {
    return null;
  }

  return {
    id: subscription.id,
    plan: subscription.plan as Plan,
    status: subscription.status as SubscriptionStatus,
    currentPeriodEnd: subscription.currentPeriodEnd,
  };
}

/**
 * Check if user has an active subscription
 * Returns the subscription if active, throws error if not
 */
export async function requireSubscription(
  userId: string
): Promise<ActiveSubscription> {
  const subscription = await getActiveSubscription(userId);

  if (!subscription) {
    throw new SubscriptionError(
      "Active subscription required to create dynamic QR codes",
      "NO_SUBSCRIPTION"
    );
  }

  return subscription;
}

/**
 * Check if user can create more QR codes based on their plan limit
 * Throws error if limit reached
 */
export async function checkQrLimit(userId: string, plan: Plan): Promise<void> {
  const limit = PLAN_LIMITS[plan];

  // Business plan has no limit
  if (limit === Infinity) {
    return;
  }

  // Count user's existing QR codes
  const result = await db
    .select({ count: count() })
    .from(qrCodes)
    .where(eq(qrCodes.userId, userId));

  const currentCount = result[0]?.count || 0;

  if (currentCount >= limit) {
    throw new SubscriptionError(
      `You have reached the ${plan} plan limit of ${limit} QR codes. Upgrade to Business for unlimited codes.`,
      "LIMIT_REACHED"
    );
  }
}

/**
 * Get user's QR code usage stats
 */
export async function getUsageStats(
  userId: string
): Promise<{ count: number; limit: number | null; plan: Plan | null }> {
  const subscription = await getActiveSubscription(userId);

  const result = await db
    .select({ count: count() })
    .from(qrCodes)
    .where(eq(qrCodes.userId, userId));

  const currentCount = result[0]?.count || 0;

  if (!subscription) {
    return { count: currentCount, limit: null, plan: null };
  }

  const limit = PLAN_LIMITS[subscription.plan];

  return {
    count: currentCount,
    limit: limit === Infinity ? null : limit,
    plan: subscription.plan,
  };
}

/**
 * Custom error class for subscription-related errors
 */
export class SubscriptionError extends Error {
  code: "NO_SUBSCRIPTION" | "LIMIT_REACHED";

  constructor(message: string, code: "NO_SUBSCRIPTION" | "LIMIT_REACHED") {
    super(message);
    this.name = "SubscriptionError";
    this.code = code;
  }
}
