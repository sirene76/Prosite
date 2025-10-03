import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" }) : null;

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe secret key is not configured" }, { status: 500 });
  }

  try {
    const { websiteId, plan } = await req.json();

    if (!websiteId) {
      return NextResponse.json({ error: "websiteId is required" }, { status: 400 });
    }

    if (plan !== "export" && plan !== "agency") {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    const exportPrice = process.env.STRIPE_PRICE_EXPORT;
    const agencyPrice = process.env.STRIPE_PRICE_AGENCY;

    if (!exportPrice || !agencyPrice) {
      return NextResponse.json({ error: "Stripe pricing is not configured" }, { status: 500 });
    }

    const price = plan === "export" ? exportPrice : agencyPrice;
    const mode: Stripe.Checkout.SessionCreateParams.Mode = plan === "export" ? "payment" : "subscription";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode,
      payment_method_types: ["card"],
      line_items: [
        {
          price,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/checkout/success?websiteId=${websiteId}`,
      cancel_url: `${appUrl}/checkout/cancel?websiteId=${websiteId}`,
      metadata: { websiteId, plan },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Error creating checkout session:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
