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
    const body = await request.json();
    if (!body?.name || typeof body.name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const providedSlug = typeof body.slug === "string" ? body.slug : "";
    const slugSource = providedSlug.trim() || body.name;
    const slug = createSlug(slugSource);
    if (!slug) {
      return NextResponse.json({ error: "Name must include at least one alphanumeric character" }, { status: 400 });
    }

    let meta: Record<string, unknown> = {};
    try {
      meta = parseMeta(body.meta);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid meta" },
        { status: 400 }
      );
    }

    const template = await Template.create({
      name: body.name.trim(),
      description: typeof body.description === "string" ? body.description : "",
      category:
        typeof body.category === "string" && body.category.trim() ? body.category.trim() : undefined,
      slug,
      previewImage:
        typeof body.previewImage === "string" && body.previewImage.trim()
          ? body.previewImage.trim()
          : undefined,
      html: typeof body.html === "string" ? body.html : "",
      css: typeof body.css === "string" ? body.css : "",
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
