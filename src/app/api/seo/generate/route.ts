import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { generateSEO } from "@/lib/seo/generateSEO";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { websiteId } = await req.json();
    if (!websiteId || typeof websiteId !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid websiteId" },
        { status: 400 }
      );
    }

    await connectDB();
    const seo = await generateSEO(websiteId);

    return NextResponse.json({ success: true, seo });
  } catch (error: any) {
    console.error("SEO generation failed:", error);
    return NextResponse.json(
      { success: false, error: error.message ?? "Failed to generate SEO" },
      { status: 500 }
    );
  }
}
