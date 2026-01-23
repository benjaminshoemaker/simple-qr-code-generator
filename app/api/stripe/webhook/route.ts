import { NextRequest, NextResponse } from "next/server";
import { stripe, getPlanFromPriceId } from "@/lib/stripe";
import { db } from "@/lib/db";
import { subscriptions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// POST /api/stripe/webhook - Handle Stripe webhook events
export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  // Verify webhook signature
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${message}`);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Error handling webhook event: ${error}`);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

// Handle checkout.session.completed - Create subscription record
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  if (session.mode !== "subscription" || !session.subscription) {
    return;
  }

  const userId = session.metadata?.userId;
  if (!userId) {
    console.error("No userId in checkout session metadata");
    return;
  }

  // Retrieve the subscription to get full details
  const subscriptionResponse = await stripe.subscriptions.retrieve(
    session.subscription as string
  );
  // Handle both Response wrapper and direct object
  const subscription = "data" in subscriptionResponse
    ? (subscriptionResponse as unknown as { data: Stripe.Subscription }).data
    : subscriptionResponse;

  const subscriptionItem = subscription.items.data[0];
  const priceId = subscriptionItem?.price.id;
  const plan = getPlanFromPriceId(priceId);

  if (!plan) {
    console.error(`Unknown price ID: ${priceId}`);
    return;
  }

  // Check if subscription already exists
  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.stripeSubscriptionId, subscription.id),
  });

  // Get period from the subscription item
  const periodStart = new Date(subscriptionItem.current_period_start * 1000);
  const periodEnd = new Date(subscriptionItem.current_period_end * 1000);

  if (existing) {
    // Update existing subscription
    await db
      .update(subscriptions)
      .set({
        stripePriceId: priceId,
        plan,
        status: subscription.status === "active" ? "active" : subscription.status,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
  } else {
    // Create new subscription record
    await db.insert(subscriptions).values({
      userId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      plan,
      status: subscription.status === "active" ? "active" : subscription.status,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    });
  }

  // Update user's stripeCustomerId if not set
  if (session.customer) {
    await db
      .update(users)
      .set({
        stripeCustomerId: session.customer as string,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }
}

// Handle customer.subscription.updated - Update subscription status
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const subscriptionItem = subscription.items.data[0];
  const priceId = subscriptionItem?.price.id;
  const plan = getPlanFromPriceId(priceId);

  // Map Stripe status to our status
  let status: string;
  switch (subscription.status) {
    case "active":
    case "trialing":
      status = "active";
      break;
    case "past_due":
      status = "past_due";
      break;
    case "canceled":
    case "unpaid":
      status = "canceled";
      break;
    default:
      status = subscription.status;
  }

  // Get period from the subscription item
  const periodStart = subscriptionItem
    ? new Date(subscriptionItem.current_period_start * 1000)
    : new Date();
  const periodEnd = subscriptionItem
    ? new Date(subscriptionItem.current_period_end * 1000)
    : new Date();

  await db
    .update(subscriptions)
    .set({
      stripePriceId: priceId,
      plan: plan || undefined,
      status,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
}

// Handle customer.subscription.deleted - Mark subscription as canceled
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await db
    .update(subscriptions)
    .set({
      status: "canceled",
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
}

// Handle invoice.payment_failed - Update status to past_due
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Get subscription from parent.subscription_details (new API structure)
  const subscriptionData = invoice.parent?.subscription_details?.subscription;
  if (!subscriptionData) {
    return;
  }

  const subscriptionId =
    typeof subscriptionData === "string"
      ? subscriptionData
      : subscriptionData.id;

  await db
    .update(subscriptions)
    .set({
      status: "past_due",
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));
}
