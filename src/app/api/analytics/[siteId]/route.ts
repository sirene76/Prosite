import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isValidObjectId } from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Analytics, { type AnalyticsModel } from "@/models/Analytics";
import Website from "@/models/Website";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { siteId } = await params;
    if (!siteId || !isValidObjectId(siteId)) {
      return NextResponse.json({ error: "Invalid site ID" }, { status: 400 });
    }

    await connectDB();

    const website = await Website.findById(siteId).select("user userId").lean();
    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    const sessionWithId = session as typeof session & { userId?: string };
    const sessionUserId = sessionWithId.userId;
    if (
      (website.user && website.user !== session.user.email) ||
      (website.userId && sessionUserId && String(website.userId) !== sessionUserId)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const stats = await Analytics.find({ siteId })
      .sort({ date: 1 })
      .limit(30)
      .lean<AnalyticsModel & { _id: unknown }>();

    const formatted = stats.map((entry) => ({
      ...entry,
      _id: entry._id ? String(entry._id) : undefined,
      date:
        entry.date instanceof Date
          ? entry.date.toISOString()
          : typeof entry.date === "string"
            ? entry.date
            : undefined,
      seoScore: typeof entry.seoScore === "number" ? entry.seoScore : 0,
      visits: typeof entry.visits === "number" ? entry.visits : 0,
      uniqueVisitors:
        typeof entry.uniqueVisitors === "number" ? entry.uniqueVisitors : 0,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Failed to load analytics", error);
    return NextResponse.json(
      { error: "Failed to load analytics" },
      { status: 500 }
    );
  }
}
