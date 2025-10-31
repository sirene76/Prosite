import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Website from "@/models/Website";
import { isValidObjectId } from "mongoose";

// ✅ src/app/api/websites/[id]/route.ts
// import { NextResponse } from "next/server";
// import { isValidObjectId } from "mongoose";
// import { connectDB } from "@/lib/db";
// import Website from "@/models/Website";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid website ID" }, { status: 400 });
    }

    await connectDB();
    const websiteDoc = await Website.findById(id).lean();

    if (!websiteDoc || typeof websiteDoc !== "object") {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    const payload = {
      ...websiteDoc,
      _id: String((websiteDoc as any)._id || id),
    };

    return NextResponse.json(payload);
  } catch (err) {
    console.error("GET error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}


export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await connectDB();
    const body = await req.json();

    // 🧩 Normalize the theme if it’s a string
    if (typeof body.theme === "string") {
      body.theme = { name: body.theme };
    }

    // 🧩 Normalize content fields (optional)
    if (body.content && typeof body.content !== "object") {
      body.content = { title: String(body.content) };
    }

    const updated = await Website.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: false, // prevent strict type enforcement on partial updates
    });

    if (!updated) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, website: updated });
  } catch (error) {
    console.error("PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update website", details: String(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid website ID" }, { status: 400 });
  }
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const website = await Website.findById(id);
  if (!website) {
    return NextResponse.json({ error: "Website not found" }, { status: 404 });
  }

  if (website.user !== session.user.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await Website.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
