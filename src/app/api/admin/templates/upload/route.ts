import { NextResponse } from "next/server";
import { mkdir, writeFile, access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";

import AdmZip from "adm-zip";

import { createSlug } from "../utils";

type TemplateMeta = Record<string, unknown> & {
  id?: unknown;
  name?: unknown;
  preview?: unknown;
  previewImage?: unknown;
  image?: unknown;
  thumbnail?: unknown;
  video?: unknown;
};

const REQUIRED_FILES = ["index.html", "style.css", "meta.json"] as const;

export const runtime = "nodejs";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing template archive" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const zip = new AdmZip(buffer);

  try {
    const entries = zip.getEntries();
    if (!entries.length) {
      return NextResponse.json({ error: "Archive is empty" }, { status: 400 });
    }

    const lookup = new Map<string, () => Buffer>();

    for (const entry of entries) {
      const filename = entry.entryName.split("/").pop();
      if (!filename) continue;
      const lower = filename.toLowerCase();
      if (REQUIRED_FILES.includes(lower as (typeof REQUIRED_FILES)[number]) && !lookup.has(lower)) {
        lookup.set(lower, entry.getData.bind(entry));
      }
    }

    for (const required of REQUIRED_FILES) {
      if (!lookup.has(required)) {
        return NextResponse.json(
          { error: `Archive is missing required file: ${required}` },
          { status: 400 }
        );
      }
    }

    const htmlEntryGetter = lookup.get("index.html");
    const cssEntryGetter = lookup.get("style.css");
    const metaEntryGetter = lookup.get("meta.json");

    if (!htmlEntryGetter || !cssEntryGetter || !metaEntryGetter) {
      return NextResponse.json({ error: "Invalid archive structure" }, { status: 400 });
    }

    const html = htmlEntryGetter().toString("utf8");
    const css = cssEntryGetter().toString("utf8");
    const metaRaw = metaEntryGetter().toString("utf8");

    let meta: TemplateMeta;
    try {
      const parsed = JSON.parse(metaRaw) as TemplateMeta;
      if (!parsed || typeof parsed !== "object") {
        throw new Error("meta.json must be an object");
      }
      meta = parsed;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to parse meta.json";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const slugSource = determineSlugSource(meta, file.name);
    const slug = createSlug(slugSource);
    if (!slug) {
      return NextResponse.json({ error: "Unable to derive template slug" }, { status: 400 });
    }

    const templatesRoot = path.join(process.cwd(), "templates");
    await mkdir(templatesRoot, { recursive: true });

    const templateDir = path.join(templatesRoot, slug);
    const exists = await directoryExists(templateDir);
    if (exists) {
      return NextResponse.json(
        { error: "A template with this slug already exists" },
        { status: 409 }
      );
    }

    for (const entry of entries) {
      const normalizedName = sanitizeEntryName(entry.entryName);
      if (!normalizedName) continue;

      const destination = path.join(templateDir, normalizedName);
      const safeDestination = path.normalize(destination);
      if (!safeDestination.startsWith(templateDir)) {
        return NextResponse.json({ error: "Archive contains invalid file paths" }, { status: 400 });
      }

      if (entry.isDirectory) {
        await mkdir(safeDestination, { recursive: true });
      } else {
        await mkdir(path.dirname(safeDestination), { recursive: true });
        const data = entry.getData();
        await writeFile(safeDestination, data);
      }
    }

    const previewImage = resolveAssetPath(meta, slug, ["preview", "previewImage", "image", "thumbnail"]);
    const previewVideo = resolveAssetPath(meta, slug, ["previewVideo", "video"]);

    const template = {
      id: typeof meta.id === "string" && meta.id.trim() ? meta.id.trim() : slug,
      name: typeof meta.name === "string" && meta.name.trim() ? meta.name.trim() : slug,
      slug,
      image: previewImage,
      previewVideo,
      assetsBasePath: `/templates/${slug}`,
      html,
      css,
      meta,
    };

    return NextResponse.json({ template });
  } finally {
    zip.dispose?.();
  }
}

function determineSlugSource(meta: TemplateMeta, fallbackName: string) {
  const id = typeof meta.id === "string" && meta.id.trim() ? meta.id.trim() : "";
  if (id) return id;
  const name = typeof meta.name === "string" && meta.name.trim() ? meta.name.trim() : "";
  if (name) return name;
  if (fallbackName) {
    const withoutExt = fallbackName.replace(/\.zip$/i, "");
    if (withoutExt.trim()) return withoutExt.trim();
  }
  return `template-${Date.now()}`;
}

async function directoryExists(dir: string) {
  try {
    await access(dir, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function sanitizeEntryName(entryName: string) {
  const normalized = entryName.replace(/\\/g, "/");
  const trimmed = normalized.replace(/^\/+/, "").trim();
  return trimmed;
}

function resolveAssetPath(meta: TemplateMeta, slug: string, keys: string[]) {
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === "string" && value.trim()) {
      const trimmed = value.trim();
      if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
      }
      const normalised = trimmed.replace(/^[\.\/\\]+/, "");
      return `/templates/${slug}/${normalised}`;
    }
  }
  return null;
}
