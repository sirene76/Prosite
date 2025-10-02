import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

type PlanId = "free" | "pro" | "agency";

type CheckoutRequest = {
  plan?: PlanId;
};

const PRICE_MAP: Record<PlanId, string> = {
  free: "price_xxx_free",
  pro: "price_xxx_pro",
  agency: "price_xxx_agency",
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { plan } = (await req.json()) as CheckoutRequest;
    const selectedPlan: PlanId = plan ?? "pro";

    const priceId = PRICE_MAP[selectedPlan];

    if (!priceId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: selectedPlan === "free" ? "payment" : "subscription",
      payment_method_types: ["card"],
      customer_email: session.user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
