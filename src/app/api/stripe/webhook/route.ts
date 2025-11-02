import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { connectDB } from "@/lib/mongodb";
import { triggerDeploy } from "@/lib/deployWorker";
import Website from "@/models/Website";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

// Map price IDs → plans
const PRICE_TO_PLAN: Record<string, "basic" | "standard" | "premium"> = {
  "price_1SOhYyQaFhkWD362FDisrEdv": "basic",
  "price_1SOhhGQaFhkWD3625hb3rV0Z": "basic",
  "price_1SOhiPQaFhkWD3627UspQ1pA": "standard",
  "price_1SOhkTQaFhkWD362P0GN4nLy": "standard",
  "price_1SOhn6QaFhkWD362CZtZPwLG": "premium",
  "price_1SOhquQaFhkWD362y31CGore": "premium",
};

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
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

  // Handle completed checkout
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const websiteId = session.metadata?.websiteId;
    const planId = session.metadata?.planId;
    const billingCycle = session.metadata?.billingCycle || "monthly";

    if (!websiteId) {
      console.error("❌ Missing websiteId in session metadata");
      return NextResponse.json({ error: "No websiteId provided" }, { status: 400 });
    }

    await connectDB();

    // Try to infer plan from price if not sent
    let plan = planId;
    if (!plan && session.line_items) {
      const firstItem = session.line_items.data[0];
      const price = (firstItem?.price as Stripe.Price)?.id;
      if (price && PRICE_TO_PLAN[price]) plan = PRICE_TO_PLAN[price];
    }

    const update: Record<string, unknown> = {
      status: "active",
      stripeSessionId: session.id,
      plan: plan || "basic",
      billingCycle,
    };

    if (typeof session.customer === "string") {
      update.stripeCustomerId = session.customer;
    } else if (session.customer && typeof session.customer === "object") {
      update.stripeCustomerId = (session.customer as any).id;
    }

    if (typeof session.subscription === "string") {
      update.stripeSubscriptionId = session.subscription;
    } else if (session.subscription && typeof session.subscription === "object") {
      update.stripeSubscriptionId = (session.subscription as any).id;
    }

    await Website.findByIdAndUpdate(websiteId, update);

    try {
      const url = await triggerDeploy(websiteId);
      console.log(`✅ Payment complete for website ${websiteId} → deployed ${url}`);
    } catch (deployError) {
      console.error(`❌ Failed to deploy website ${websiteId} after checkout`, deployError);
    }
  }

  return NextResponse.json({ received: true });
}
