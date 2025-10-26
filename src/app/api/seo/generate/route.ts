import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { generateSEO } from "@/lib/seo/generateSEO";

export async function POST(req: Request) {
  const { websiteId } = await req.json();

  if (!websiteId || typeof websiteId !== "string") {
    return NextResponse.json(
      { success: false, error: "Missing websiteId" },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    const seo = await generateSEO(websiteId);
    return NextResponse.json({ success: true, seo });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message ?? "Failed to generate SEO" },
      { status: 500 }
    );
  }
}
