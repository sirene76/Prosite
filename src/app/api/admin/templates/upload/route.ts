import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Buffer } from "node:buffer";
import AdmZip, { type IZipEntry } from "adm-zip";
import slugify from "slugify";

import { uploadFile } from "@/lib/uploadFile";
import { connectDB } from "@/lib/mongodb";
import { Template } from "@/models/template";
import { createSlug } from "@/app/api/admin/templates/utils";

import type { TemplateMeta } from "@/types/template";

type UploadedTemplateMeta = TemplateMeta & {
  [key: string]: unknown;
};

type UploadSuccessResponse = {
  success: true;
  template: {
    id: string;
    slug: string;
    htmlUrl: string;
    cssUrl: string;
    jsUrl: string | null;
    meta: UploadedTemplateMeta;
    metaUrl: string;
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

function resolveStatusCode(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  if ("status" in error && typeof (error as { status?: unknown }).status === "number") {
    return (error as { status?: number }).status;
  }

  if ("statusCode" in error && typeof (error as { statusCode?: unknown }).statusCode === "number") {
    return (error as { statusCode?: number }).statusCode;
  }

  return undefined;
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

    const storageKey = `${slug}-${randomUUID()}`;
    const trimmedJs = js.trim();

    const uploadJsPromise = trimmedJs
      ? uploadFile({
          buffer: Buffer.from(js, "utf-8"),
          fileName: `${storageKey}/script.js`,
          contentType: "application/javascript",
        }).catch((error: unknown) => {
          const status = resolveStatusCode(error);

          if (status === 400 || (error instanceof Error && /\b400\b/.test(error.message))) {
            return null;
          }

          throw error;
        })
      : Promise.resolve<string | null>(null);

    const [htmlUrl, cssUrl, metaUrl, jsUrl] = await Promise.all([
      uploadFile({
        buffer: Buffer.from(html, "utf-8"),
        fileName: `${storageKey}/index.html`,
        contentType: "text/html",
      }),
      uploadFile({
        buffer: Buffer.from(css, "utf-8"),
        fileName: `${storageKey}/style.css`,
        contentType: "text/css",
      }),
      uploadFile({
        buffer: Buffer.from(JSON.stringify(meta, null, 2), "utf-8"),
        fileName: `${storageKey}/meta.json`,
        contentType: "application/json",
      }),
      uploadJsPromise,
    ]);

    await connectDB();

    const name = stringOrUndefined(meta.name) ?? slug;
    const category = stringOrUndefined(meta.category) ?? "Uncategorized";
    const description = stringOrUndefined(meta.description) ?? "";
    const image = stringOrUndefined(meta.image);

    const setUpdate: Record<string, unknown> = {
      name,
      slug,
      category,
      description,
      htmlUrl,
      cssUrl,
      metaUrl,
      meta,
    };

    if (image) {
      setUpdate.image = image;
    }

    if (jsUrl) {
      setUpdate.jsUrl = jsUrl;
    }

    const shouldPersistInlineJs = Boolean(trimmedJs) && !jsUrl;

    if (shouldPersistInlineJs) {
      setUpdate.js = js;
    }

    const unsetUpdate: Record<string, 1> = { html: 1, css: 1 };

    if (!shouldPersistInlineJs) {
      unsetUpdate.js = 1;
    }

    if (!image) {
      unsetUpdate.image = 1;
    }
    if (!jsUrl) {
      unsetUpdate.jsUrl = 1;
    }

    const templateDoc = (await Template.findOneAndUpdate(
      { slug },
      {
        $set: setUpdate,
        $unset: unsetUpdate,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean()) as (Record<string, any> & { _id?: string }) | null;

    const id = templateDoc?._id?.toString?.() ?? randomUUID();

    return NextResponse.json<UploadSuccessResponse>({
      success: true,
      template: {
        id,
        slug,
        htmlUrl,
        cssUrl,
        jsUrl,
        meta,
        metaUrl,
      },
    });
  } catch (error: unknown) {
    console.error("UPLOAD TEMPLATE ERROR:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json<ErrorResponse>({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  return NextResponse.json({ success: true });
}
