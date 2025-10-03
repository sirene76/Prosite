import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Website } from "@/models/website";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { websiteId, plan } = await req.json();
    await connectDB();
    const website = await Website.findById(websiteId);
    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    if (website.user && website.user !== session.user.email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (plan === "free") {
      await Website.findByIdAndUpdate(websiteId, {
        status: "active",
        plan: "free",
      });

      return NextResponse.json({ url: `/checkout/success?websiteId=${websiteId}` });
    }

    let lineItemPrice = "";
    let mode: "payment" | "subscription" = "payment";

    if (plan === "export") {
      lineItemPrice = process.env.STRIPE_PRICE_EXPORT ?? "";
      mode = "payment";
    } else if (plan === "agency") {
      lineItemPrice = process.env.STRIPE_PRICE_AGENCY ?? "";
      mode = "subscription";
    }

    if (!lineItemPrice) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const stripeSession = await stripe.checkout.sessions.create({
      mode,
      payment_method_types: ["card"],
      line_items: [
        {
          price: lineItemPrice,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?websiteId=${websiteId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel?websiteId=${websiteId}`,
      metadata: { websiteId, plan },
      customer_email: session.user.email!,
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
