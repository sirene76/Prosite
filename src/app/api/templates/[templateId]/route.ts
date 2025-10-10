import { NextResponse } from "next/server";

import { getTemplateById } from "@/lib/templates";

export async function GET(
  req: Request,
  { params }: { params: { templateId: string } }
) {
  const template = await getTemplateById(params.templateId);
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: template._id,
    name: template.name,
    html: template.html ?? "",
    css: template.css ?? "",
    meta: template.meta ?? {},
    createdAt:
      template.createdAt instanceof Date
        ? template.createdAt.toISOString()
        : template.createdAt,
  });
}
