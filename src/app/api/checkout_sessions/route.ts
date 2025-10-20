import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Website from "@/models/Website";

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

    const priceMap: Record<string, string | undefined> = {
      free: undefined,
      pro: process.env.STRIPE_PRICE_PRO,
      agency: process.env.STRIPE_PRICE_AGENCY,
    };

    const priceId = priceMap[plan as keyof typeof priceMap];

    if (!priceId && plan !== "free") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (plan === "free") {
      await Website.findByIdAndUpdate(websiteId, {
        status: "active",
        plan: "free",
      });

      return NextResponse.json({
        url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/${websiteId}?success=true`,
      });
    }

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId!,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/${websiteId}?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/${websiteId}?canceled=true`,
      metadata: { websiteId, plan },
      customer_email: session.user.email!,
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
