import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Buffer } from "node:buffer";
import fs from "fs";
import path from "path";
import AdmZip, { type IZipEntry } from "adm-zip";
import slugify from "slugify";

import { createSlug } from "@/app/api/admin/templates/utils";
import { renderPreview } from "@/lib/renderPreview";
import { renderTemplate } from "@/lib/renderTemplate";
import {
  buildFieldDefaults,
  ensureTemplateFieldIds,
  normaliseTemplateFields,
} from "@/lib/templateFieldUtils";
import { uploadFile } from "@/lib/uploadFile";
import { DEFAULT_TEMPLATE_THUMBNAIL } from "@/lib/constants";

import type { TemplateMeta } from "@/types/template";

const REQUIRED_FILES = ["index.html", "style.css", "meta.json"] as const;
const STAGING_ROOT = path.join(process.cwd(), ".upload-staging");

type UploadedTemplateMeta = TemplateMeta & {
  [key: string]: unknown;
};

type AssetMap = Record<string, string>;

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
  assets: AssetMap;
  image?: string | null;
  thumbnail?: string | null;
  previewVideo?: string | null;
};

type UploadSuccessResponse = {
  success: true;
  template: {
    stageId: string;
    basePath?: string | null;
    previewPath?: string | null;
    previewHtml?: string | null;
    name?: string | null;
    category?: string | null;
    description?: string | null;
    meta?: UploadedTemplateMeta;
    image?: string | null;
    thumbnail?: string | null;
    previewUrl?: string | null;
    previewVideo?: string | null;
  };
};

type ErrorResponse = {
  error: string;
};

function ensureStagingRoot() {
  fs.mkdirSync(STAGING_ROOT, { recursive: true });
}

function stageInfoPath(stageId: string) {
  return path.join(STAGING_ROOT, `${stageId}.json`);
}

function normaliseEntryName(entry: IZipEntry) {
  return entry.entryName.replace(/\\/g, "/");
}

function findEntry(entries: IZipEntry[], fileName: string): IZipEntry | null {
  return (
    entries.find((entry) => {
      if (entry.isDirectory) return false;
      const normalised = normaliseEntryName(entry);
      return normalised.split("/").pop() === fileName;
    }) ?? null
  );
}

function ensureRequiredFiles(entries: IZipEntry[]) {
  for (const required of REQUIRED_FILES) {
    if (!findEntry(entries, required)) {
      throw new Error(`${required} is required in the uploaded archive`);
    }
  }
}

function parseMeta(content: string): UploadedTemplateMeta {
  try {
    const parsed = JSON.parse(content) as UploadedTemplateMeta;
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
    throw new Error("Meta must be a JSON object");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid meta.json";
    throw new Error(message);
  }
}

function resolveSlug(meta: UploadedTemplateMeta): string {
  const providedSlug =
    typeof meta.slug === "string" && meta.slug.trim() ? meta.slug.trim() : "";
  if (providedSlug) {
    const normalised = createSlug(providedSlug) || slugify(providedSlug, { lower: true, strict: true });
    if (normalised) {
      return normalised;
    }
  }

  const fallbackSource =
    (typeof meta.name === "string" && meta.name.trim()) ||
    (typeof meta.id === "string" && meta.id.trim()) ||
    "template";

  const derived = slugify(fallbackSource, { lower: true, strict: true }) || createSlug(fallbackSource);
  if (derived) {
    return derived;
  }

  return `template-${randomUUID()}`;
}

function stringOrUndefined(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getDirectory(entryPath: string) {
  const normalised = entryPath.includes("/") ? entryPath.slice(0, entryPath.lastIndexOf("/")) : "";
  return normalised;
}

function sanitizeUploadFileName(stageId: string, entryName: string) {
  const safe = entryName
    .replace(/\\/g, "/")
    .replace(/\.\.+/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-");
  return `${stageId}-${safe}`;
}

function detectContentType(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".html")) return "text/html";
  if (lower.endsWith(".css")) return "text/css";
  if (lower.endsWith(".js")) return "application/javascript";
  if (lower.endsWith(".json")) return "application/json";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".avif")) return "image/avif";
  if (lower.endsWith(".woff2")) return "font/woff2";
  if (lower.endsWith(".woff")) return "font/woff";
  if (lower.endsWith(".ttf")) return "font/ttf";
  if (lower.endsWith(".otf")) return "font/otf";
  if (lower.endsWith(".eot")) return "application/vnd.ms-fontobject";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".ogg")) return "video/ogg";
  return "application/octet-stream";
}

function normaliseAssetKey(value: string) {
  const normalised = path.posix.normalize(value.replace(/\\/g, "/"));
  const segments = normalised.split("/").filter((segment) => segment && segment !== "." && segment !== "..");
  return segments.join("/");
}

function resolveAssetUrl(value: string, baseDir: string, assets: AssetMap) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^(?:https?:|data:|mailto:|tel:|#|javascript:)/i.test(trimmed)) {
    return null;
  }

  const match = trimmed.match(/^([^?#]+)(.*)$/);
  if (!match) return null;

  const [, rawPath, suffix] = match;
  let candidate = rawPath.replace(/\\/g, "/");

  if (candidate.startsWith("/")) {
    candidate = candidate.replace(/^\/+/g, "");
  } else if (baseDir) {
    candidate = path.posix.join(baseDir, candidate);
  }

  const key = normaliseAssetKey(candidate);
  if (!key) return null;

  const remote = assets[key];
  if (!remote) return null;

  return `${remote}${suffix}`;
}

function rewriteHtmlWithAssets(html: string, baseDir: string, assets: AssetMap) {
  if (!html) return "";

  let output = html.replace(
    /(src|href)=(["'])([^"']+)(["'])/gi,
    (_match, attr: string, quote: string, value: string) => {
      const resolved = resolveAssetUrl(value, baseDir, assets);
      if (!resolved) return `${attr}=${quote}${value}${quote}`;
      return `${attr}=${quote}${resolved}${quote}`;
    }
  );

  output = output.replace(/srcset=(["'])([^"']+)(["'])/gi, (_match, quote: string, value: string) => {
    const parts = value.split(",").map((part) => {
      const [candidate, descriptor] = part.trim().split(/\s+/, 2);
      const resolved = resolveAssetUrl(candidate, baseDir, assets);
      if (!resolved) {
        return part.trim();
      }
      return descriptor ? `${resolved} ${descriptor}` : resolved;
    });
    return `srcset=${quote}${parts.join(", ")}${quote}`;
  });

  return output;
}

function rewriteCssWithAssets(css: string, baseDir: string, assets: AssetMap) {
  if (!css) return "";

  return css.replace(/url\((\s*['"]?)([^"')]+)(['"]?\s*)\)/gi, (_match, prefix: string, value: string, suffix: string) => {
    const resolved = resolveAssetUrl(value, baseDir, assets);
    if (!resolved) return `url(${prefix}${value}${suffix})`;
    return `url(${prefix}${resolved}${suffix})`;
  });
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
    const data = await req.formData();
    const file = data.get("file") as File | null;
    const rawImageUrl = data.get("imageUrl");
    const rawThumbnailUrl = data.get("thumbnailUrl");
    const rawVideoUrl = data.get("videoUrl");

    if (!file) {
      return NextResponse.json<ErrorResponse>({ error: "Missing file" }, { status: 400 });
    }

    const imageUrl = typeof rawImageUrl === "string" && rawImageUrl.trim() ? rawImageUrl.trim() : null;
    const thumbnailUrl =
      typeof rawThumbnailUrl === "string" && rawThumbnailUrl.trim() ? rawThumbnailUrl.trim() : null;
    const videoUrl = typeof rawVideoUrl === "string" && rawVideoUrl.trim() ? rawVideoUrl.trim() : null;

    const buffer = Buffer.from(await file.arrayBuffer());
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();

    ensureRequiredFiles(entries);

    const htmlEntry = findEntry(entries, "index.html");
    const cssEntry = findEntry(entries, "style.css");
    const metaEntry = findEntry(entries, "meta.json");
    const scriptEntry = findEntry(entries, "script.js");

    if (!htmlEntry || !cssEntry || !metaEntry) {
      return NextResponse.json<ErrorResponse>(
        { error: "index.html, style.css, and meta.json are required" },
        { status: 400 }
      );
    }

    const fileBuffers = new Map<string, Buffer>();
    for (const entry of entries) {
      const entryName = normaliseEntryName(entry);

      if (entryName.includes("..") || entryName.startsWith("/")) {
        throw new Error("Archive contains invalid paths");
      }

      if (entry.isDirectory) {
        continue;
      }

      fileBuffers.set(entryName, entry.getData());
    }

    const htmlEntryPath = normaliseEntryName(htmlEntry);
    const cssEntryPath = normaliseEntryName(cssEntry);
    const metaEntryPath = normaliseEntryName(metaEntry);
    const scriptEntryPath = scriptEntry ? normaliseEntryName(scriptEntry) : null;

    const htmlDir = getDirectory(htmlEntryPath);
    const cssDir = getDirectory(cssEntryPath);

    const html = fileBuffers.get(htmlEntryPath)?.toString("utf-8") ?? "";
    const css = fileBuffers.get(cssEntryPath)?.toString("utf-8") ?? "";
    const js = scriptEntryPath ? fileBuffers.get(scriptEntryPath)?.toString("utf-8") ?? "" : "";
    const meta = parseMeta(fileBuffers.get(metaEntryPath)?.toString("utf-8") ?? "{}");

    const adminImage = imageUrl && imageUrl.trim() ? imageUrl.trim() : null;
    const metaImage = typeof meta.image === "string" && meta.image.trim() ? meta.image.trim() : null;
    const resolvedImage = adminImage ?? metaImage ?? DEFAULT_TEMPLATE_THUMBNAIL;

    const metaThumbnail =
      typeof (meta as UploadedTemplateMeta & { thumbnail?: unknown }).thumbnail === "string" &&
      ((meta as UploadedTemplateMeta & { thumbnail?: string }).thumbnail ?? "").trim()
        ? (meta as UploadedTemplateMeta & { thumbnail: string }).thumbnail.trim()
        : null;
    const resolvedThumbnail =
      thumbnailUrl ?? metaThumbnail ?? resolvedImage ?? DEFAULT_TEMPLATE_THUMBNAIL;
    const previewUrl =
      (typeof meta.previewUrl === "string" && meta.previewUrl.trim() ? meta.previewUrl.trim() : null) ||
      resolvedImage ||
      resolvedThumbnail ||
      DEFAULT_TEMPLATE_THUMBNAIL;

    const slug = resolveSlug(meta);
    meta.slug = slug;
    meta.fields = ensureTemplateFieldIds(meta.fields);

    const stageId = randomUUID();
    const assetMap: AssetMap = {};
    const nonCoreEntries = Array.from(fileBuffers.entries()).filter(
      ([entryName]) =>
        entryName !== htmlEntryPath &&
        entryName !== cssEntryPath &&
        entryName !== metaEntryPath &&
        entryName !== scriptEntryPath,
    );

    for (const [entryName, entryBuffer] of nonCoreEntries) {
      const key = normaliseAssetKey(entryName);
      if (!key) continue;
      const url = await uploadFile({
        buffer: entryBuffer,
        fileName: sanitizeUploadFileName(stageId, entryName),
        contentType: detectContentType(entryName),
      });
      assetMap[key] = url;
    }

    const processedCss = rewriteCssWithAssets(css, cssDir, assetMap);
    const cssUrl = await uploadFile({
      buffer: Buffer.from(processedCss, "utf-8"),
      fileName: sanitizeUploadFileName(stageId, cssEntryPath),
      contentType: "text/css",
    });
    assetMap[normaliseAssetKey(cssEntryPath)] = cssUrl;

    let jsUrl: string | undefined;
    if (scriptEntryPath) {
      jsUrl = await uploadFile({
        buffer: Buffer.from(js, "utf-8"),
        fileName: sanitizeUploadFileName(stageId, scriptEntryPath),
        contentType: "application/javascript",
      });
      assetMap[normaliseAssetKey(scriptEntryPath)] = jsUrl;
    }

    const metaString = JSON.stringify(meta, null, 2);
    const metaUrl = await uploadFile({
      buffer: Buffer.from(metaString, "utf-8"),
      fileName: sanitizeUploadFileName(stageId, metaEntryPath),
      contentType: "application/json",
    });
    assetMap[normaliseAssetKey(metaEntryPath)] = metaUrl;

    const processedHtml = rewriteHtmlWithAssets(html, htmlDir, assetMap);
    const htmlUrl = await uploadFile({
      buffer: Buffer.from(processedHtml, "utf-8"),
      fileName: sanitizeUploadFileName(stageId, htmlEntryPath),
      contentType: "text/html",
    });
    assetMap[normaliseAssetKey(htmlEntryPath)] = htmlUrl;

    const defaults = buildFieldDefaults(normaliseTemplateFields(meta.fields));
    const renderedHtml = renderTemplate({
      html: processedHtml,
      values: defaults,
      modules: meta?.modules || [],
    });

    const previewDocument = await renderPreview({
      html: processedHtml,
      css: processedCss,
      js,
      meta,
      htmlUrl,
      cssUrl,
      jsUrl,
    });

    const previewHtmlUrl = await uploadFile({
      buffer: Buffer.from(previewDocument, "utf-8"),
      fileName: `${stageId}-preview.html`,
      contentType: "text/html",
    });

    const metaPreviewVideoValue =
      typeof meta.previewVideo === "string" && meta.previewVideo.trim() ? meta.previewVideo.trim() : null;
    const resolvedPreviewVideo = videoUrl ?? metaPreviewVideoValue ?? null;
    if (!meta.previewUrl && previewUrl) {
      meta.previewUrl = previewUrl;
    }

    const stageInfo: StageInfo = {
      stageId,
      folderName: slug,
      originalHtml: html,
      processedHtml,
      renderedHtml,
      css: processedCss,
      js,
      meta,
      htmlUrl,
      cssUrl,
      jsUrl,
      metaUrl,
      previewUrl: previewHtmlUrl,
      previewHtml: previewDocument,
      assets: assetMap,
      image: resolvedImage,
      thumbnail: resolvedThumbnail,
      previewVideo: resolvedPreviewVideo,
    };

    ensureStagingRoot();
    fs.writeFileSync(stageInfoPath(stageId), JSON.stringify(stageInfo, null, 2), "utf-8");

    const name = stringOrUndefined(meta.name) ?? slug;
    const category = stringOrUndefined(meta.category) ?? "Uncategorized";
    const description = stringOrUndefined(meta.description) ?? "";
    const basePath = deriveRemoteBase(htmlUrl) ?? deriveRemoteBase(cssUrl) ?? null;

    const response: UploadSuccessResponse = {
      success: true,
      template: {
        stageId,
        basePath,
        previewPath: previewHtmlUrl,
        previewHtml: previewDocument,
        name,
        category,
        description,
        meta,
        image: resolvedImage ?? null,
        thumbnail: resolvedThumbnail ?? null,
        previewUrl,
        previewVideo: resolvedPreviewVideo ?? null,
      },
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("UPLOAD TEMPLATE ERROR:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json<ErrorResponse>({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const stageId = typeof (body as { stageId?: unknown }).stageId === "string" ? (body as { stageId: string }).stageId : null;

    if (!stageId) {
      return NextResponse.json({ success: true });
    }

    const infoPath = stageInfoPath(stageId);

    if (fs.existsSync(infoPath)) {
      fs.unlinkSync(infoPath);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("UPLOAD TEMPLATE DELETE ERROR:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json<ErrorResponse>({ error: message }, { status: 500 });
  }
}
