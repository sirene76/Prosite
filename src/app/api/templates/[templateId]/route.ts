import { NextResponse } from "next/server";

import { getTemplateById } from "@/lib/templates";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params;
  const template = await getTemplateById(templateId);
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  let meta: unknown = template.meta ?? {};
  if (typeof template.meta === "string") {
    try {
      meta = JSON.parse(template.meta);
    } catch (error) {
      console.error(`Failed to parse template ${template._id} meta`, error);
      meta = {};
    }
  }

  return NextResponse.json({
    htmlUrl: template.htmlUrl ?? null,
    cssUrl: template.cssUrl ?? null,
    jsUrl: template.jsUrl ?? null,
    metaUrl: template.metaUrl ?? null,
    meta,
  });
}
