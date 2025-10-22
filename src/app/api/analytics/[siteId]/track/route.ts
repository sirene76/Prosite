import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import Website from "@/models/Website";

export async function POST(
  _req: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    await connectDB();
    await Website.findByIdAndUpdate(params.siteId, {
      $inc: { "analytics.views": 1 },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ analytics error", err);
    return NextResponse.json(
      { error: "Analytics tracking failed" },
      { status: 500 }
    );
  }
}
