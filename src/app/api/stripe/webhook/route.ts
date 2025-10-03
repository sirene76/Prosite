import { NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/lib/mongodb";
import { Website } from "@/models/website";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    let eventHandled = false;

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const websiteId = session.metadata?.websiteId;
      const plan = session.metadata?.plan;

      if (websiteId) {
        await connectDB();
        const update: Record<string, unknown> = { status: "active" };
        if (plan) {
          update.plan = plan;
        }

        await Website.findByIdAndUpdate(websiteId, update);
        eventHandled = true;
      }
    }

    if (!eventHandled) {
      console.warn(`Unhandled Stripe webhook event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook error:", message);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}
