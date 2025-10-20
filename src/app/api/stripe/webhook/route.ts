import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { connectDB } from "@/lib/mongodb";
import { enqueueDeployJob } from "@/lib/queue";
import Website from "@/models/Website";

export const config = {
  api: {
    bodyParser: false, // Required to read raw body for Stripe signature
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 }
    );
  }

  const rawBody = Buffer.from(await req.arrayBuffer());

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("⚠️  Webhook signature verification failed.", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const websiteId = session.metadata?.websiteId;
    const plan = session.metadata?.plan;

    if (!websiteId) {
      console.error("❌ Missing websiteId in session metadata");
      return NextResponse.json(
        { error: "No websiteId provided" },
        { status: 400 }
      );
    }

    await connectDB();

    const update: Record<string, unknown> = {
      status: "deploying",
      stripeSessionId: session.id,
    };

    if (plan) {
      update.plan = plan;
    }

    const customer = session.customer;
    if (typeof customer === "string") {
      update.stripeCustomerId = customer;
    } else if (customer && typeof customer === "object" && "id" in customer) {
      update.stripeCustomerId = customer.id;
    }

    const subscription = session.subscription;
    if (typeof subscription === "string") {
      update.stripeSubscriptionId = subscription;
    } else if (
      subscription &&
      typeof subscription === "object" &&
      "id" in subscription
    ) {
      update.stripeSubscriptionId = subscription.id;
    }

    await Website.findByIdAndUpdate(websiteId, update);

    await enqueueDeployJob(websiteId);

    console.log(
      `✅ Payment complete for website ${websiteId} → queued for deploy`
    );
  }

  return NextResponse.json({ received: true });
}
