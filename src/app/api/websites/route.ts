import { NextResponse } from "next/server";
import { loadTemplateAssets } from "@/lib/templates";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const templateId = searchParams.get("templateId");

  if (!templateId) {
    return NextResponse.json({ error: "templateId is required" }, { status: 400 });
  }

  try {
    const assets = await loadTemplateAssets(templateId);
    return NextResponse.json(assets);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to load template" }, { status: 404 });
  }
}
