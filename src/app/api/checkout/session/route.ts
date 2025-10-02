import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

type PlanId = "free" | "pro" | "agency";

function resolvePriceId(plan: PlanId) {
  const priceMap: Record<PlanId, string | undefined> = {
    free: process.env.STRIPE_PRICE_ID_FREE,
    pro: process.env.STRIPE_PRICE_ID_PRO,
    agency: process.env.STRIPE_PRICE_ID_AGENCY,
  };

  return priceMap[plan];
}

function isSupportedPlan(value: string | undefined): value is PlanId {
  return value === "free" || value === "pro" || value === "agency";
}

export async function POST(req: Request) {
  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecret) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2024-06-20",
    });

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { plan } = (await req.json()) as { plan?: string };

    if (!isSupportedPlan(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const priceId = resolvePriceId(plan);

    if (!priceId) {
      return NextResponse.json({ error: "Plan is not configured" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: session.user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/cancel`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
