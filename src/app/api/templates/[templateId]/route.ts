import { NextResponse } from "next/server";
import { loadTemplateAssets } from "@/lib/templates";

type RouteContext = {
  params: {
    templateId: string;
  };
};

export async function GET(_request: Request, context: RouteContext) {
  const templateId = context.params?.templateId;

  if (!templateId) {
    return NextResponse.json({ error: "Template identifier is required" }, { status: 400 });
  }

  try {
    const assets = await loadTemplateAssets(templateId);
    return NextResponse.json(assets);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }
}
