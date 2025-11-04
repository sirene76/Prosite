// src/app/api/websites/[id]/update/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isValidObjectId } from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Website from "@/models/Website";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = params;
    if (!id || !isValidObjectId(id))
      return NextResponse.json({ error: "Invalid website ID" }, { status: 400 });

    const body = await req.json();
    const { values, content, theme } = body || {};

    await connectDB();
    const website = await Website.findById(id);
    if (!website)
      return NextResponse.json({ error: "Website not found" }, { status: 404 });

    // ✅ Ownership check
    const sessionUserId = (session as any).userId;
    if (
      (website.user && website.user !== session.user.email) ||
      (website.userId &&
        sessionUserId &&
        String(website.userId) !== String(sessionUserId))
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ✅ Merge new values (deep merge-safe)
    if (values && typeof values === "object") {
      website.values = {
        ...(website.values || {}),
        ...values,
      };
    }

    // ✅ Sync branding fields when provided
    if (content && typeof content === "object") {
      website.content = {
        ...(website.content || {}),
        ...content,
      };
    }

    // ✅ Update theme if provided
    if (theme && typeof theme === "object") {
      website.theme = {
        ...(website.theme || {}),
        name: theme.name ?? website.theme?.name ?? "default",
        label: theme.label ?? website.theme?.label ?? null,
        colors: theme.colors ?? website.theme?.colors ?? {},
        fonts: theme.fonts ?? website.theme?.fonts ?? {},
      };
    }

    await website.save();

    return NextResponse.json({
      success: true,
      message: "Website updated successfully",
      website,
    });
  } catch (error) {
    console.error("❌ Error updating website:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
