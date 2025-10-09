import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { Template } from "@/models/template";

import { createSlug, parseMeta } from "./utils";

export async function GET() {
  await connectDB();
  const templates = await Template.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(templates);
}

export async function POST(request: Request) {
  await connectDB();

  try {
    const {
      name,
      slug: providedSlug = "",
      category,
      description,
      previewImage,
      html,
      css,
      meta: rawMeta,
    } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const slugSource =
      (typeof providedSlug === "string" ? providedSlug : "").trim() || name;
    const slug = createSlug(slugSource);
    if (!slug) {
      return NextResponse.json({ error: "Name must include at least one alphanumeric character" }, { status: 400 });
    }

    let meta: Record<string, unknown> = {};
    try {
      meta = parseMeta(rawMeta);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid meta" },
        { status: 400 }
      );
    }

    const template = await Template.create({
      name: name.trim(),
      description: typeof description === "string" ? description : "",
      category:
        typeof category === "string" && category.trim() ? category.trim() : undefined,
      slug,
      previewImage:
        typeof previewImage === "string" && previewImage.trim()
          ? previewImage.trim()
          : undefined,
      html: typeof html === "string" ? html : "",
      css: typeof css === "string" ? css : "",
      meta,
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "A template with this name already exists" }, { status: 409 });
    }

    console.error("Failed to create template", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
