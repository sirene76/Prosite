import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isValidObjectId } from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Website from "@/models/Website";
import { scanSEO } from "@/lib/seoScanner";

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
    const website = await Website.findById(siteId);
    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    const sessionWithId = session as typeof session & { userId?: string };
    if (
      (website.user && website.user !== session.user.email) ||
      (website.userId && sessionWithId.userId && String(website.userId) !== sessionWithId.userId)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const deployment = website.deployment as { url?: unknown } | undefined;
    const deploymentUrl =
      deployment && typeof deployment.url === "string" ? deployment.url : undefined;

    const { score, suggestions } = await scanSEO(deploymentUrl);
    const lastScan = new Date();

    website.seo = {
      score,
      lastScan,
      suggestions,
    };
    await website.save();

    return NextResponse.json({ score, suggestions, lastScan });
  } catch (error) {
    console.error("SEO scan failed", error);
    return NextResponse.json({ error: "Failed to run SEO scan" }, { status: 500 });
  }
}
