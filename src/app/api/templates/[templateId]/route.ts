import { NextResponse } from "next/server";

import { getTemplateAssets, getTemplates } from "@/lib/templates";
import { applyThemeTokens, renderTemplate } from "@/lib/renderTemplate";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
): Promise<Response> {
  const url = new URL(request.url);
  const format = url.searchParams.get("format");
  const accept = request.headers.get("accept") ?? "";
  const wantsJson = format === "json" || accept.includes("application/json");

  try {
    const { templateId } = await params;

    if (!templateId) {
      if (wantsJson) {
        return NextResponse.json({ error: "Template not found" }, { status: 400 });
      }
      return new Response("Template not found", { status: 400 });
    }

    const assets = await getTemplateAssets(templateId);
    const templates = await getTemplates();

    const templateMeta = templates.find((template) => template.id === templateId);
    const placeholders = extractPlaceholders(assets.html);
    const sampleData = Object.fromEntries(
      placeholders.map((key) => {
        const label = key.split(".").pop() ?? key;
        return [key, toSentence(label)];
      })
    );

    const themeDefaults = Object.fromEntries(
      (templateMeta?.colors ?? []).map((color) => [color.id, color.default ?? ""])
    );

    const colorTokens = buildColorTokens(templateMeta?.colors ?? [], themeDefaults);
    const fontTokens = buildFontTokens(assets.css, templateMeta?.fonts ?? []);

    const rendered = renderTemplate({
      html: assets.html,
      values: sampleData,
      modules: templateMeta?.modules ?? [],
      theme: {
        primary: colorTokens.primary,
        secondary: colorTokens.secondary,
        background: colorTokens.background,
        text: colorTokens.text,
      },
      themeTokens: {
        colors: colorTokens,
        fonts: fontTokens,
      },
    });

    const document = applyThemeTokens({
      html: rendered,
      css: assets.css,
      templateId,
      colors: colorTokens,
      fonts: fontTokens,
    });

    const cacheHeaders = {
      "Cache-Control": "s-maxage=300, stale-while-revalidate=900",
    } as const;

    if (wantsJson) {
      return NextResponse.json(
        { html: assets.html, css: assets.css, rendered: document, document },
        { headers: cacheHeaders }
      );
    }

    return new Response(document, {
      status: 200,
      headers: {
        ...cacheHeaders,
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Unable to render template preview", error);
    if (wantsJson) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    return new Response("Template not found", { status: 404 });
  }
}

function buildColorTokens(
  colors: Array<{ id: string; default?: string }>,
  defaults: Record<string, string>
) {
  const tokens: Record<string, string> = {};
  colors.forEach((color) => {
    const value = defaults[color.id] ?? color.default ?? "";
    if (value) {
      tokens[color.id] = value;
    }
  });
  return tokens;
}

function buildFontTokens(css: string, fontKeys: string[]) {
  const tokens: Record<string, string> = {};
  fontKeys.forEach((key) => {
    const pattern = new RegExp(`var\\(\\s*--font-${escapeRegExp(key)}\\s*,\\s*([^\\)]+)\\)`, "gi");
    const match = pattern.exec(css);
    if (match) {
      tokens[key] = match[1].trim();
    }
  });
  return tokens;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractPlaceholders(html: string) {
  const matches = html.match(/{{(.*?)}}/g) ?? [];
  const set = new Set<string>();
  matches.forEach((match) => {
    const key = match.slice(2, -2).trim();
    if (key) {
      set.add(key);
    }
  });
  return Array.from(set);
}

function toSentence(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (match) => match.toUpperCase());
}
