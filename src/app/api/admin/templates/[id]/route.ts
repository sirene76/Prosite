import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { Template } from "@/models/template";

import { createSlug, sanitizeTemplatePayload } from "../utils";

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
    const payload = sanitizeTemplatePayload(body);

    if (typeof body?.name === "string") {
      const slug = createSlug(body.name);
      if (!slug) {
        return NextResponse.json(
          { error: "Name must include at least one alphanumeric character" },
          { status: 400 }
        );
      }
      payload.slug = slug;
    }

    const updated = await Template.findByIdAndUpdate(params.id, payload, { new: true });
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
