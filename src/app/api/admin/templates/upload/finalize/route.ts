import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import slugify from "slugify";

import { connectDB } from "@/lib/mongodb";
import { Template } from "@/models/template";
import { createSlug } from "@/app/api/admin/templates/utils";
import { ensureTemplateFieldIds } from "@/lib/templateFieldUtils";
import { DEFAULT_TEMPLATE_THUMBNAIL } from "@/lib/constants";

import type { TemplateMeta } from "@/types/template";

type StageInfo = {
  stageId: string;
  folderName: string;
  originalHtml: string;
  processedHtml: string;
  renderedHtml: string;
  css: string;
  js: string;
  meta: TemplateMeta;
  htmlUrl: string;
  cssUrl: string;
  jsUrl?: string;
  metaUrl: string;
  previewUrl: string;
  previewHtml: string;
  assets: Record<string, string>;
  image?: string;
  thumbnail?: string;
  previewVideo?: string;
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
    previewVideo?: string | null;
    image?: string | null;
    thumbnail?: string | null;
  };
};

const STAGING_ROOT = path.join(process.cwd(), ".upload-staging");

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

function normaliseString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
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

    const stagedImage = normaliseString(info.image);
    const metaImage = normaliseString(info.meta?.image);
    const resolvedImage = stagedImage ?? metaImage ?? DEFAULT_TEMPLATE_THUMBNAIL;

    const stagedMeta = info.meta as StageInfo["meta"] & { thumbnail?: string | null };
    const stagedThumbnailFromInfo = normaliseString(info.thumbnail);
    const stagedThumbnailFromMeta = normaliseString(stagedMeta.thumbnail);
    const resolvedThumbnail =
      stagedThumbnailFromInfo ?? stagedThumbnailFromMeta ?? resolvedImage ?? DEFAULT_TEMPLATE_THUMBNAIL;
    const resolvedPreviewUrl =
      stagedImage ??
      normaliseString(stagedMeta.previewUrl) ??
      metaImage ??
      resolvedThumbnail ??
      DEFAULT_TEMPLATE_THUMBNAIL;

    info.meta.image = resolvedImage;
    stagedMeta.thumbnail = resolvedThumbnail;
    stagedMeta.previewUrl = resolvedPreviewUrl;

    const stagedPreviewVideo =
      typeof info.previewVideo === "string" && info.previewVideo.trim() ? info.previewVideo.trim() : undefined;
    if (stagedPreviewVideo) {
      info.meta.previewVideo = stagedPreviewVideo;
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
    const previewVideo =
      stagedPreviewVideo ||
      (typeof info.meta.previewVideo === "string" && info.meta.previewVideo.trim()
        ? info.meta.previewVideo.trim()
        : undefined);

    const templateDoc = await Template.findOneAndUpdate(
      { name: templateName },
      {
        name: templateName,
        slug: templateSlug,
        category,
        description,
        image: resolvedImage,
        previewVideo,
        thumbnail: resolvedThumbnail,
        published: true,
        html: sanitizedHtml,
        css: info.css,
        js: info.js,
        meta: info.meta,
        htmlUrl: info.htmlUrl,
        cssUrl: info.cssUrl,
        jsUrl: info.jsUrl,
        metaUrl: info.metaUrl,
        previewUrl: resolvedPreviewUrl,
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
        previewVideo: previewVideo ?? null,
        image: resolvedImage,
        thumbnail: resolvedThumbnail,
      },
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("FINALIZE TEMPLATE ERROR:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json<ErrorResponse>({ error: message }, { status: 500 });
  }
}
