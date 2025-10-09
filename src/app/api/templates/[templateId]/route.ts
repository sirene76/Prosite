import { connectDB } from "@/lib/mongodb";
import { Template } from "@/models/template";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { templateId: string } }
) {
  await connectDB();
  const template = await Template.findById(params.templateId).lean();
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const serialized = {
    ...template,
    _id: template._id.toString(),
    createdAt:
      template.createdAt instanceof Date ? template.createdAt.toISOString() : template.createdAt,
    updatedAt:
      template.updatedAt instanceof Date ? template.updatedAt.toISOString() : template.updatedAt,
  };

  return NextResponse.json(serialized);
}
