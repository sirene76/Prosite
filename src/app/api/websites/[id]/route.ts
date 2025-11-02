import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Website from "@/models/Website";
import { isValidObjectId } from "mongoose";

// =======================================================
// GET → used by the builder to load website + template data
// =======================================================
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

    // ✅ Explicitly typecast to avoid array/union inference errors
    interface WebsiteDoc {
      _id: string;
      name?: string;
      templateId?: string;
      theme?: any;
      content?: Record<string, any>;
      branding?: Record<string, any>;
    }

    const website = (await Website.findById(id).lean()) as WebsiteDoc | null;

    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    // ✅ Normalize content keys (fallback for legacy schema)
    const normalizeContent = (c: any = {}) => ({
      title: c.title || c.websiteTitle || "",
      businessName: c.businessName || c.companyName || "",
      logoUrl: c.logoUrl || c.logo || "",
    });

    const content = normalizeContent(website.content);
    const branding = website.branding || normalizeContent(website.content);

    return NextResponse.json({
      id: website._id.toString(),
      name: website.name || "",
      templateId: website.templateId || "",
      theme: website.theme || {},
      content,
      branding,
    });
  } catch (err) {
    console.error("GET error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


// =======================================================
// PATCH → updates website fields (theme, content, etc.)
// =======================================================
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await connectDB();
    const body = await req.json();

    // 🧩 Normalize theme if it’s a string
    if (typeof body.theme === "string") {
      body.theme = { name: body.theme };
    }

    // 🧩 Basic content normalization
    if (body.content && typeof body.content !== "object") {
      body.content = { title: String(body.content) };
    }

    const updated = await Website.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: false, // allow partial updates
    });

    if (!updated) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, website: updated });
  } catch (error) {
    console.error("PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update website", details: String(error) },
      { status: 500 }
    );
  }
}

// =======================================================
// DELETE → remove website
// =======================================================
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
