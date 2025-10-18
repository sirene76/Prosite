import { NextResponse } from "next/server";

import { getTemplateAssets, getTemplateById } from "@/lib/templates";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params;
  const template = await getTemplateById(templateId);
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const assets = await getTemplateAssets(templateId);

  let meta: unknown = template.meta ?? {};
  if (typeof template.meta === "string") {
    try {
      meta = JSON.parse(template.meta);
    } catch (error) {
      console.error(`Failed to parse template ${template._id} meta`, error);
      meta = {};
    }
  }

  const resolvedTemplate = assets?.template ?? template;
  const html = assets?.html ?? resolvedTemplate.html ?? null;
  const css = assets?.css ?? resolvedTemplate.css ?? null;
  const js = resolvedTemplate.js ?? null;
  const resolvedMeta = (resolvedTemplate.meta ?? meta ?? {}) as Record<string, unknown>;

  return NextResponse.json({
    htmlUrl: resolvedTemplate.htmlUrl ?? null,
    cssUrl: resolvedTemplate.cssUrl ?? null,
    jsUrl: resolvedTemplate.jsUrl ?? null,
    metaUrl: resolvedTemplate.metaUrl ?? null,
    html,
    css,
    js,
    meta: resolvedMeta,
  });
}
