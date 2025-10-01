import { NextResponse } from "next/server";

import { getTemplateCss, getTemplateHtml } from "@/lib/templates";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const {id: templateId} = await params;

  if (!templateId) {
    return NextResponse.json({ error: "Template id is required" }, { status: 400 });
  }

  try {
    const [html, css] = await Promise.all([
      getTemplateHtml(templateId),
      getTemplateCss(templateId)
    ]);

    return NextResponse.json({ html, css });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to load template" }, { status: 404 });
  }
}
