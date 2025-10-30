import { NextResponse } from "next/server";

import { renderTemplate } from "@/lib/renderTemplate";

type RenderPreviewBody = {
  html?: unknown;
  values?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RenderPreviewBody;
    const html = typeof body.html === "string" ? body.html : "";
    const values =
      body.values && typeof body.values === "object"
        ? (body.values as Record<string, unknown>)
        : {};

    const rendered = renderTemplate({ html, values });
    return NextResponse.json({ rendered });
  } catch (error) {
    console.error("Failed to render preview", error);
    return NextResponse.json({ error: "Unable to render preview" }, { status: 400 });
  }
}
