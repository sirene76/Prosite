import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { Template } from "@/models/template";

import { createSlug, parseMeta } from "../utils";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  await connectDB();

  try {
    const template = await Template.findById(params.id).lean();
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    if (isCastError(error)) {
      return NextResponse.json({ error: "Invalid template id" }, { status: 400 });
    }

    console.error(`Failed to fetch template ${params.id}`, error);
    return NextResponse.json({ error: "Failed to fetch template" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  await connectDB();

  try {
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (typeof body.name === "string") {
      const trimmedName = body.name.trim();
      if (!trimmedName) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
      }

      updates.name = trimmedName;

      if (!body.slug) {
        const generatedSlug = createSlug(trimmedName);
        if (!generatedSlug) {
          return NextResponse.json(
            { error: "Name must include at least one alphanumeric character" },
            { status: 400 }
          );
        }
        updates.slug = generatedSlug;
      }
    }

    if (typeof body.slug === "string" && body.slug.trim()) {
      const slug = createSlug(body.slug);
      if (!slug) {
        return NextResponse.json(
          { error: "Slug must include at least one alphanumeric character" },
          { status: 400 }
        );
      }
      updates.slug = slug;
    }

    if (body.category !== undefined) {
      updates.category = typeof body.category === "string" && body.category.trim() ? body.category.trim() : undefined;
    }

    if (body.description !== undefined) {
      updates.description = typeof body.description === "string" ? body.description : "";
    }

    if (body.previewImage !== undefined) {
      updates.previewImage =
        typeof body.previewImage === "string" && body.previewImage.trim() ? body.previewImage.trim() : undefined;
    }

    if (body.html !== undefined) {
      updates.html = typeof body.html === "string" ? body.html : "";
    }

    if (body.css !== undefined) {
      updates.css = typeof body.css === "string" ? body.css : "";
    }

    if (body.meta !== undefined) {
      try {
        updates.meta = parseMeta(body.meta);
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Invalid meta" },
          { status: 400 }
        );
      }
    }

    const updated = await Template.findByIdAndUpdate(params.id, updates, { new: true });
    if (!updated) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "A template with this name already exists" }, { status: 409 });
    }

    if (isCastError(error)) {
      return NextResponse.json({ error: "Invalid template id" }, { status: 400 });
    }

    console.error(`Failed to update template ${params.id}`, error);
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  await connectDB();

  try {
    await Template.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (isCastError(error)) {
      return NextResponse.json({ error: "Invalid template id" }, { status: 400 });
    }

    console.error(`Failed to delete template ${params.id}`, error);
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}

function isCastError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && (error as { name?: string }).name === "CastError");
}
