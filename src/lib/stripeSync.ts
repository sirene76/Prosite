import Stripe from "stripe";

import { connectDB } from "@/lib/db";
import Website from "@/models/Website";

const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);
const INACTIVE_STATUSES = new Set([
  "canceled",
  "unpaid",
  "incomplete_expired",
]);

export type StripeSyncSummary = {
  synced: number;
  deactivated: number;
  skipped: number;
  errors: string[];
};

function resolvePlanName(subscription: Stripe.Subscription) {
  const primaryItem = subscription.items.data[0];
  if (!primaryItem) {
    return "Pro";
  }

  return primaryItem.price.nickname || primaryItem.price.id || "Pro";
}

function shouldDeactivateSubscription(
  subscription: Stripe.Subscription,
  periodEnd: Date
) {
  if (periodEnd.getTime() <= Date.now()) {
    return true;
  }

  if (INACTIVE_STATUSES.has(subscription.status)) {
    return true;
  }

  return false;
}

async function listAllSubscriptions(stripe: Stripe) {
  const subscriptions: Stripe.Subscription[] = [];
  let startingAfter: string | undefined;

  while (true) {
    const response = await stripe.subscriptions.list({
      limit: 100,
      status: "all",
      starting_after: startingAfter,
    });

    subscriptions.push(...response.data);

    if (!response.has_more) {
      break;
    }

    startingAfter = response.data[response.data.length - 1]?.id;
    if (!startingAfter) {
      break;
    }
  }

  return subscriptions;
}

export async function syncStripeSubscriptions(): Promise<StripeSyncSummary> {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return {
      synced: 0,
      deactivated: 0,
      skipped: 0,
      errors: ["Missing STRIPE_SECRET_KEY"],
    };
  }

  const stripe = new Stripe(secret, { apiVersion: "2023-10-16" });

  await connectDB();

  const summary: StripeSyncSummary = {
    synced: 0,
    deactivated: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const subscriptions = await listAllSubscriptions(stripe);

    for (const subscription of subscriptions) {
      const websiteId = subscription.metadata?.websiteId;
      if (!websiteId) {
        summary.skipped += 1;
        continue;
      }

      const plan = resolvePlanName(subscription);
      const periodEnd = new Date(subscription.current_period_end * 1000);
      const deactivate = shouldDeactivateSubscription(subscription, periodEnd);

      const update: Record<string, unknown> = {
        plan,
        planExpiresAt: periodEnd,
        subscriptionId: subscription.id,
        stripeSubscriptionId: subscription.id,
      };

      if (deactivate) {
        update.status = "preview";
      } else if (ACTIVE_STATUSES.has(subscription.status)) {
        update.status = "active";
      }

      try {
        const result = await Website.updateOne(
          { _id: websiteId },
          { $set: update }
        );

        if (result.matchedCount === 0) {
          summary.skipped += 1;
          continue;
        }

        summary.synced += 1;
        if (deactivate && result.modifiedCount > 0) {
          summary.deactivated += 1;
        }
      } catch (error) {
        summary.errors.push(
          `Failed to update website ${websiteId}: ${String(error)}`
        );
      }
    }

    const now = new Date();
    const expiredResult = await Website.updateMany(
      {
        planExpiresAt: { $lte: now },
        status: { $ne: "preview" },
      },
      {
        $set: { status: "preview" },
      }
    );

    summary.deactivated += expiredResult.modifiedCount;
  } catch (error) {
    summary.errors.push(`Stripe sync failed: ${String(error)}`);
  }

  return summary;
}
