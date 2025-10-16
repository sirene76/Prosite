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

import type { TemplateMeta } from "@/types/template";

type UploadedTemplateMeta = TemplateMeta & {
  [key: string]: unknown;
};

type StageInfo = {
  stageId: string;
  folderName: string;
  templateRootRelative: string;
  originalHtml: string;
  renderedHtml: string;
  css: string;
  js: string;
  meta: TemplateMeta & {
    image?: string;
  };
};

type UploadSuccessResponse = {
  success: true;
  template: {
    stageId: string;
    basePath: string;
    previewPath: string;
    name?: string | null;
    category?: string | null;
    description?: string | null;
    meta?: UploadedTemplateMeta;
  };
};

type ErrorResponse = {
  error: string;
};

const REQUIRED_FILES = ["index.html", "style.css", "meta.json"] as const;

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

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const file = data.get("file") as File | null;

    if (!file) {
      return NextResponse.json<ErrorResponse>({ error: "Missing file" }, { status: 400 });
    }

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

    const html = htmlEntry.getData().toString("utf-8");
    const css = cssEntry.getData().toString("utf-8");
    const js = scriptEntry ? scriptEntry.getData().toString("utf-8") : "";
    const meta = parseMeta(metaEntry.getData().toString("utf-8"));

    const slug = resolveSlug(meta);
    meta.slug = slug;

    const uploadsDir = path.join(process.cwd(), "public", "templates");
    const stagingDir = path.join(uploadsDir, "_staging");
    const stageId = randomUUID();
    const stageDir = path.join(stagingDir, stageId);

    fs.mkdirSync(stageDir, { recursive: true });

    for (const entry of entries) {
      const entryName = normaliseEntryName(entry);

      if (entryName.includes("..") || entryName.startsWith("/")) {
        throw new Error("Archive contains invalid paths");
      }

      const destinationPath = path.join(stageDir, entryName);

      if (entry.isDirectory) {
        fs.mkdirSync(destinationPath, { recursive: true });
        continue;
      }

      fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
      fs.writeFileSync(destinationPath, entry.getData());
    }

    const htmlEntryPath = normaliseEntryName(htmlEntry);
    const htmlDir = htmlEntryPath.includes("/")
      ? htmlEntryPath.slice(0, htmlEntryPath.lastIndexOf("/"))
      : "";

    const templateRootRelative = path.posix.join("_staging", stageId, htmlDir);
    const stageBasePath = `/templates/_staging/${stageId}`;
    const templateBasePath = htmlDir ? `${stageBasePath}/${htmlDir}` : stageBasePath;

    meta.fields = ensureTemplateFieldIds(meta.fields);

    const defaults = buildFieldDefaults(normaliseTemplateFields(meta.fields));

    const renderedHtml = renderTemplate({
      html,
      values: defaults,
      modules: meta?.modules || [],
    });

    const previewDocument = await renderPreview({
      html,
      css,
      js,
      meta: meta,
      assetBase: templateBasePath,
    });

    fs.writeFileSync(path.join(stageDir, "preview.html"), previewDocument, "utf-8");

    const stageInfo: StageInfo = {
      stageId,
      folderName: slug,
      templateRootRelative,
      originalHtml: html,
      renderedHtml,
      css,
      js,
      meta,
    };

    fs.writeFileSync(path.join(stageDir, "__stage.json"), JSON.stringify(stageInfo, null, 2), "utf-8");

    const name = stringOrUndefined(meta.name) ?? slug;
    const category = stringOrUndefined(meta.category) ?? "Uncategorized";
    const description = stringOrUndefined(meta.description) ?? "";

    const response: UploadSuccessResponse = {
      success: true,
      template: {
        stageId,
        basePath: `${stageBasePath}/`,
        previewPath: `${stageBasePath}/preview.html`,
        name,
        category,
        description,
        meta,
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

    const stageDir = path.join(process.cwd(), "public", "templates", "_staging", stageId);

    if (fs.existsSync(stageDir)) {
      fs.rmSync(stageDir, { recursive: true, force: true });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("UPLOAD TEMPLATE DELETE ERROR:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json<ErrorResponse>({ error: message }, { status: 500 });
  }
}
