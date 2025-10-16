import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import slugify from "slugify";

import { connectDB } from "@/lib/mongodb";
import { Template } from "@/models/template";
import { createSlug } from "@/app/api/admin/templates/utils";
import { ensureTemplateFieldIds } from "@/lib/templateFieldUtils";

import type { TemplateMeta } from "@/types/template";

type StageInfo = {
  stageId: string;
  folderName: string;
  originalHtml: string;
  processedHtml: string;
  renderedHtml: string;
  css: string;
  js: string;
  meta: TemplateMeta & {
    image?: string;
  };
  htmlUrl: string;
  cssUrl: string;
  jsUrl?: string;
  metaUrl: string;
  previewUrl: string;
  assets: Record<string, string>;
};

type FinalizeRequest = {
  stageId?: string;
  nameOverride?: string;
};

type ErrorResponse = {
  error: string;
};

type TemplateResponse = {
  success: true;
  template: {
    name?: string | null;
    category?: string | null;
    description?: string | null;
    meta?: TemplateMeta | null;
    basePath?: string | null;
    previewPath?: string | null;
  };
};

const STAGING_ROOT = path.join(process.cwd(), ".upload-staging");
const DEFAULT_PREVIEW_IMAGE = "/templates/default-template-preview.svg";

function stageInfoPath(stageId: string) {
  return path.join(STAGING_ROOT, `${stageId}.json`);
}

function normalizeTemplateName(info: StageInfo, override?: string | null) {
  if (typeof override === "string" && override.trim()) {
    return override.trim();
  }

  if (typeof info.meta?.name === "string" && info.meta.name.trim()) {
    return info.meta.name.trim();
  }

  return info.folderName;
}

function disableExternalScripts(html: string): string {
  return html.replace(
    /<script\b[^>]*\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)')[^>]*>\s*<\/script>/gi,
    (_match, doubleQuotedSrc: string, singleQuotedSrc: string) => {
      const srcPath = doubleQuotedSrc || singleQuotedSrc || "";
      return `<noscript data-disabled-script="${srcPath}"></noscript>`;
    }
  );
}

function resolveTemplateImage(meta: StageInfo["meta"]) {
  const providedImage = typeof meta.image === "string" && meta.image.trim() ? meta.image.trim() : "";
  if (providedImage) {
    return providedImage;
  }

  return DEFAULT_PREVIEW_IMAGE;
}

function deriveRemoteBase(url: string | null | undefined) {
  if (!url) return null;
  try {
    const [cleaned] = url.split("?");
    if (!cleaned) return null;
    const lastSlash = cleaned.lastIndexOf("/");
    if (lastSlash === -1) {
      return `${cleaned}/`;
    }
    return `${cleaned.slice(0, lastSlash + 1)}`;
  } catch (error) {
    console.error("Failed to derive remote base", error);
    return null;
  }
}

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as FinalizeRequest;
    const stageId = typeof body.stageId === "string" ? body.stageId : null;

    if (!stageId) {
      return NextResponse.json<ErrorResponse>({ error: "stageId is required" }, { status: 400 });
    }

    const infoPath = stageInfoPath(stageId);

    if (!fs.existsSync(infoPath)) {
      return NextResponse.json<ErrorResponse>({ error: "Upload stage not found" }, { status: 404 });
    }

    const info = JSON.parse(fs.readFileSync(infoPath, "utf-8")) as StageInfo;
    info.meta.fields = ensureTemplateFieldIds(info.meta.fields);

    await connectDB();

    const templateName = normalizeTemplateName(info, body.nameOverride ?? null);
    const category = typeof info.meta?.category === "string" ? info.meta.category : "Uncategorized";
    const description = typeof info.meta?.description === "string" ? info.meta.description : "";
    const image = resolveTemplateImage(info.meta);

    if (!info.meta.image) {
      info.meta.image = image;
    }

    const slugFromMeta =
      typeof info.meta?.slug === "string" && info.meta.slug.trim()
        ? info.meta.slug.trim()
        : null;
    const generatedSlug =
      slugFromMeta || slugify(templateName, { lower: true, strict: true }) || createSlug(templateName);
    const templateSlug = generatedSlug || createSlug(info.folderName) || info.folderName;

    if (info.meta) {
      info.meta.slug = templateSlug;
    }

    const sanitizedHtml = disableExternalScripts(info.processedHtml);
    const basePath = deriveRemoteBase(info.htmlUrl) ?? deriveRemoteBase(info.cssUrl) ?? null;

    const templateDoc = await Template.findOneAndUpdate(
      { name: templateName },
      {
        name: templateName,
        slug: templateSlug,
        category,
        description,
        image,
        published: true,
        html: sanitizedHtml,
        css: info.css,
        js: info.js,
        meta: info.meta,
        htmlUrl: info.htmlUrl,
        cssUrl: info.cssUrl,
        jsUrl: info.jsUrl,
        metaUrl: info.metaUrl,
        previewUrl: info.previewUrl,
      },
      { new: true, upsert: true }
    );

    if (fs.existsSync(infoPath)) {
      fs.unlinkSync(infoPath);
    }

    const response: TemplateResponse = {
      success: true,
      template: {
        name: templateDoc?.name ?? templateName,
        category: templateDoc?.category ?? category,
        description: templateDoc?.description ?? description,
        meta: info.meta,
        basePath,
        previewPath: info.previewUrl,
      },
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("FINALIZE TEMPLATE ERROR:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json<ErrorResponse>({ error: message }, { status: 500 });
  }
}
