import Stripe from "stripe";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Website from "@/models/Website";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

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
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      priceId,
      websiteId,
      planId,
      billingCycle,
      values,
      theme,
      themeId,
      content,
    } = body;

    if (!priceId || !websiteId || !planId || !billingCycle) {
      return NextResponse.json({ error: "Missing required checkout parameters" }, { status: 400 });
    }

    const validIds = Object.values(STRIPE_PRICE_IDS).flatMap(c => Object.values(c));
    if (!validIds.includes(priceId)) {
      return NextResponse.json({ error: "Invalid Stripe price ID" }, { status: 400 });
    }

    await connectDB();
    const website = await Website.findById(websiteId);
    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    // ✅ Save builder values
    if (values && typeof values === "object") {
      website.values = { ...(website.values || {}), ...values };
    }

    // ✅ Save branding content (title, businessName, logo)
    if (content && typeof content === "object") {
      website.content = {
        ...(website.content || {}),
        ...content,
      };
    }

    // ✅ Save theme safely
    if (theme && typeof theme === "object") {
      website.theme = {
        ...(website.theme || {}),
        name: theme.name ?? website.theme?.name ?? "default",
        label: theme.label ?? website.theme?.label ?? null,
        colors: theme.colors ?? website.theme?.colors ?? {},
        fonts: theme.fonts ?? website.theme?.fonts ?? {},
      };
    }

    if (typeof themeId === "string" && themeId.trim().length > 0) {
      website.theme = {
        ...(website.theme || {}),
        name: themeId,
        label: website.theme?.label ?? theme?.label ?? themeId,
      };
    }

    await website.save();

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/${websiteId}?canceled=true`,
      metadata: { websiteId, planId, billingCycle },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Stripe Checkout Error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
