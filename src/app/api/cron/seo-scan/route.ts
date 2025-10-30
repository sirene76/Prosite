import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";

import { connectDB } from "@/lib/db";
import { scanSEO } from "@/lib/seoScanner";
import Analytics from "@/models/Analytics";
import Website from "@/models/Website";

function isAuthorized(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  return secret && secret === process.env.CRON_SECRET;
}

async function handleRequest(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const websites = await Website.find({ status: "active" })
      .select({ deployment: 1 })
      .lean<{ _id: Types.ObjectId; deployment?: { url?: string | null } }>();

    let scanned = 0;
    const errors: string[] = [];

    for (const site of websites) {
      const siteId = String(site._id);

      try {
        const result = await scanSEO(site.deployment?.url || undefined);

        await Website.updateOne(
          { _id: site._id },
          {
            $set: {
              "seo.score": result.score,
              "seo.lastScan": new Date(),
              "seo.suggestions": result.suggestions,
            },
          }
        );

        // Ensure a persistent record exists for dashboards
        await Analytics.create({ siteId, seoScore: result.score });

        scanned += 1;
      } catch (error) {
        errors.push(`Failed to scan site ${siteId}: ${String(error)}`);
      }
    }

    return NextResponse.json({ scanned, updated: scanned, errors });
  } catch (error) {
    console.error("SEO cron failed", error);
    return NextResponse.json(
      { error: "SEO scan failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleRequest(req);
}

export async function POST(req: NextRequest) {
  return handleRequest(req);
}
