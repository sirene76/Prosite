import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { Template } from "@/models/template";

export async function GET(request: Request) {
  await connectDB();

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const trimmedCategory = category && category.trim() ? category.trim() : null;

  const query = trimmedCategory
    ? { published: true, category: trimmedCategory }
    : { published: true };

  const projection = {
    name: 1,
    category: 1,
    description: 1,
    image: 1,
    previewVideo: 1,
    slug: 1,
  } as const;

  const templates = await Template.find(query, projection).sort({ createdAt: -1 }).lean();

  const normalized = templates.map((template) => ({
    ...template,
    _id: template._id.toString(),
  }));

  return NextResponse.json({ templates: normalized });
}
