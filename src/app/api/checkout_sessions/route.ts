// ✅ src/app/api/checkout_sessions/route.ts
import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// Stripe price IDs (your new ones)
const STRIPE_PRICE_IDS = {
  basic: {
    monthly: "price_1SOhYyQaFhkWD362FDisrEdv",
    yearly: "price_1SOhhGQaFhkWD3625hb3rV0Z",
  },
  standard: {
    monthly: "price_1SOhiPQaFhkWD3627UspQ1pA",
    yearly: "price_1SOhkTQaFhkWD362P0GN4nLy",
  },
  premium: {
    monthly: "price_1SOhn6QaFhkWD362CZtZPwLG",
    yearly: "price_1SOhquQaFhkWD362y31CGore",
  },
};

export async function POST(req: Request) {
  try {
    const { priceId, websiteId, planId, billingCycle } = await req.json();

    if (!priceId || !websiteId || !planId || !billingCycle) {
      return NextResponse.json(
        { error: "Missing required checkout parameters" },
        { status: 400 }
      );
    }

    // Verify the priceId is valid from our constant map
    const validIds = Object.values(STRIPE_PRICE_IDS)
      .flatMap((cycle) => Object.values(cycle));
    if (!validIds.includes(priceId)) {
      console.error("❌ Invalid price ID:", priceId);
      return NextResponse.json(
        { error: "Invalid Stripe price ID" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/${websiteId}?canceled=true`,
      metadata: {
        websiteId,
        planId,
        billingCycle, // store monthly/yearly toggle
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe Checkout Error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
