import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import Subscriber from "@/models/Subscriber";

export async function POST(
  req: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const siteId = params.siteId;
    const body = await req.json();

    await connectDB();

    const existing = await Subscriber.findOne({ siteId, email: body.email });
    if (existing) {
      return NextResponse.json({ success: true });
    }

    await Subscriber.create({ siteId, email: body.email });
    console.log(`📰 Newsletter subscription from ${body.email} for ${siteId}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ newsletter error", err);
    return NextResponse.json(
      { error: "Subscription failed" },
      { status: 500 }
    );
  }
}
