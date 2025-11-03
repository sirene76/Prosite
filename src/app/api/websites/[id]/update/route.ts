import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isValidObjectId } from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Website from "@/models/Website";

/**
 * PATCH /api/websites/[id]/update
 * Body: { values: Record<string, unknown> }
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid website ID" }, { status: 400 });
    }

    const { values } = await req.json();

    await connectDB();
    const website = await Website.findById(id);
    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    // Ensure the logged-in user owns this website
    const sessionUserId = (session as any).userId;
    if (
      (website.user && website.user !== session.user.email) ||
      (website.userId && sessionUserId && String(website.userId) !== sessionUserId)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ✅ Merge new values with existing
    website.values = {
      ...(website.values || {}),
      ...(values || {}),
    };

    await website.save();

    return NextResponse.json({
      success: true,
      message: "Website content updated successfully",
      website,
    });
  } catch (error) {
    console.error("Error updating website values:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
