import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { Template } from "@/models/template";

import { createSlug, sanitizeTemplatePayload } from "./utils";

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

    const slug = createSlug(body.name);
    if (!slug) {
      return NextResponse.json({ error: "Name must include at least one alphanumeric character" }, { status: 400 });
    }

    const payload = sanitizeTemplatePayload(body);
    const template = await Template.create({ ...payload, slug });
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "A template with this name already exists" }, { status: 409 });
    }

    console.error("Failed to create template", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
