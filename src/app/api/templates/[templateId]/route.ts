import { NextResponse } from "next/server";

import { loadTemplateAssets } from "@/lib/templates";

export async function GET(
  request: Request,
  { params }: { params: { templateId: string } }
): Promise<NextResponse<{ html: string; css: string }>> {
  try {
    const { templateId } = params;
    const assets = await loadTemplateAssets(templateId);
    return NextResponse.json(assets, {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Failed to load template assets", error);
    return NextResponse.json({ html: "", css: "" }, { status: 404 });
  }
}
