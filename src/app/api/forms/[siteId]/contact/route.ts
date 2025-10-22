import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import Message from "@/models/Message";

export async function POST(
  req: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const siteId = params.siteId;
    const body = await req.json();

    await connectDB();

    await Message.create({
      siteId,
      name: body.name,
      email: body.email,
      message: body.message,
    });

    console.log(`📩 New contact form from ${body.email} for ${siteId}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ contact form error", err);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
