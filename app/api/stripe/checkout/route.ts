import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { stripe, getPriceId } from "@/lib/stripe";

const checkoutSchema = z.object({
  plan: z.enum(["pro", "business"]),
  period: z.enum(["monthly", "annual"]),
});

// POST /api/stripe/checkout - Create Stripe Checkout session
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = checkoutSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { plan, period } = result.data;
  const priceId = getPriceId(plan, period);

  // Get user to check if they already have a Stripe customer ID
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get or create Stripe customer
  let customerId = user.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: {
        userId: user.id,
      },
    });
    customerId = customer.id;

    // Save Stripe customer ID to user record
    await db
      .update(users)
      .set({ stripeCustomerId: customerId, updatedAt: new Date() })
      .where(eq(users.id, user.id));
  }

  // Build success and cancel URLs
  const origin = request.headers.get("origin") || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const successUrl = `${origin}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/billing?canceled=true`;

  // Create Checkout Session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId: user.id,
      plan,
      period,
    },
    subscription_data: {
      metadata: {
        userId: user.id,
        plan,
      },
    },
  });

  return NextResponse.json({
    url: checkoutSession.url,
    sessionId: checkoutSession.id,
  });
}
