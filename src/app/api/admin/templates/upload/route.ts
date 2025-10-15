import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import slugify from "slugify";

import { renderTemplate } from "@/lib/renderTemplate";
import { createSlug } from "@/app/api/admin/templates/utils";

import type { TemplateMeta } from "@/types/template";

type UploadedTemplateField = {
  default?: unknown;
};

type UploadedTemplateModule = {
  id?: unknown;
  label?: unknown;
  description?: unknown;
};

type UploadedTemplateMeta = TemplateMeta & {
  fields?: Record<string, UploadedTemplateField>;
  modules?: UploadedTemplateModule[];
  [key: string]: unknown;
};

type StageInfo = {
  stageId: string;
  folderName: string;
  templateRootRelative: string;
  /** Raw template HTML that still includes placeholder tokens */
  originalHtml: string;
  /** HTML rendered with default values for quick previews */
  renderedHtml: string;
  css: string;
  js: string;
  meta: UploadedTemplateMeta;
};

type TemplatePreviewResponse = {
  success: true;
  template: {
    name?: string | null;
    category?: string | null;
    description?: string | null;
    meta?: UploadedTemplateMeta | null;
    basePath: string;
    previewPath: string;
    stageId: string;
  };
};

type ErrorResponse = {
  error: string;
};

export const runtime = "nodejs";

const REQUIRED_FILES = ["index.html", "style.css", "meta.json"] as const;

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function findTemplateRoot(baseDir: string): string | null {
  const hasRequiredFiles = REQUIRED_FILES.every((file) =>
    fs.existsSync(path.join(baseDir, file))
  );

  if (hasRequiredFiles) {
    return baseDir;
  }

  const children = fs
    .readdirSync(baseDir)
    .filter((entry) => !entry.startsWith("."));

  for (const child of children) {
    const childPath = path.join(baseDir, child);
    if (!fs.statSync(childPath).isDirectory()) continue;
    const nested = findTemplateRoot(childPath);
    if (nested) return nested;
  }

  return null;
}

function collectDefaultValues(meta: UploadedTemplateMeta): Record<string, string> {
  const values: Record<string, string> = {};

  if (!meta.fields) return values;

  for (const [key, field] of Object.entries(meta.fields)) {
    const defaultValue = field?.default;
    if (typeof defaultValue === "string") {
      values[key] = defaultValue;
    } else if (defaultValue !== undefined && defaultValue !== null) {
      values[key] = String(defaultValue);
    } else {
      values[key] = "";
    }
  }

  return values;
}

function deriveModules(meta: UploadedTemplateMeta) {
  return (
    meta.modules?.map((mod) => {
      const rawLabel = mod?.label;
      const label =
        typeof rawLabel === "string"
          ? rawLabel
          : rawLabel !== undefined && rawLabel !== null
            ? String(rawLabel)
            : "Module";

      const rawId = mod?.id;
      const id =
        typeof rawId === "string"
          ? rawId
          : rawId !== undefined && rawId !== null
            ? String(rawId)
            : label.toLowerCase().replace(/\s+/g, "-");

      return {
        id,
        label,
        description: `${label} content preview for ${meta.name || "template"}`,
      };
    }) || []
  );
}

function rewriteAssetPaths(html: string, basePath: string): string {
  return html
    .replace(/href="style\.css"/g, `href="${basePath}style.css"`)
    .replace(/src="script\.js"/g, `src="${basePath}script.js"`)
    .replace(/src="images\//g, `src="${basePath}images/`)
    .replace(/src="assets\//g, `src="${basePath}assets/`);
}

function disableExternalScripts(html: string): string {
  return html.replace(
    /<script\b[^>]*\bsrc\s*=\s*(?:"([^"]*script\.js)"|'([^']*script\.js)')[^>]*>\s*<\/script>/gi,
    (_match, doubleQuotedSrc: string, singleQuotedSrc: string) => {
      const srcPath = doubleQuotedSrc || singleQuotedSrc || "";
      return `<noscript data-disabled-script="${srcPath}"></noscript>`;
    }
  );
}

function normalizeFolderName(meta: UploadedTemplateMeta, fallback: string): string {
  if (typeof meta.id === "string" && meta.id.trim()) {
    return createSlug(meta.id.trim());
  }

  if (typeof meta.name === "string" && meta.name.trim()) {
    const slug = createSlug(meta.name.trim());
    if (slug) return slug;
  }

  return createSlug(fallback) || fallback;
}

function stageInfoPath(stageDir: string): string {
  return path.join(stageDir, "__stage.json");
}

function buildPreviewResponse(info: StageInfo): TemplatePreviewResponse {
  const basePath = `/templates/${info.templateRootRelative}/`;

  return {
    success: true,
    template: {
      name: info.meta?.name ?? info.folderName,
      category: info.meta?.category ?? null,
      description: info.meta?.description ?? null,
      meta: info.meta,
      basePath,
      previewPath: `${basePath}preview.html`,
      stageId: info.stageId,
    },
  };
}

export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const file = data.get("file") as File;

    if (!file) {
      return NextResponse.json<ErrorResponse>({ error: "Missing file" }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "templates");
    const stagingDir = path.join(uploadsDir, "_staging");
    ensureDir(uploadsDir);
    ensureDir(stagingDir);

    const stageId = randomUUID();
    const stageDir = path.join(stagingDir, stageId);
    ensureDir(stageDir);

    const buffer = Buffer.from(await file.arrayBuffer());
    const tempZipPath = path.join(stageDir, `upload.zip`);
    fs.writeFileSync(tempZipPath, buffer);

    try {
      const zip = new AdmZip(tempZipPath);
      zip.extractAllTo(stageDir, true);
    } finally {
      if (fs.existsSync(tempZipPath)) {
        fs.unlinkSync(tempZipPath);
      }
    }

    const templateRoot = findTemplateRoot(stageDir);

    if (!templateRoot) {
      fs.rmSync(stageDir, { recursive: true, force: true });
      return NextResponse.json<ErrorResponse>(
        { error: "index.html, style.css, and meta.json required" },
        { status: 400 }
      );
    }

    const htmlPath = path.join(templateRoot, "index.html");
    const cssPath = path.join(templateRoot, "style.css");
    const metaPath = path.join(templateRoot, "meta.json");
    const scriptPath = path.join(templateRoot, "script.js");

    const html = fs.readFileSync(htmlPath, "utf-8");
    const css = fs.readFileSync(cssPath, "utf-8");
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8")) as UploadedTemplateMeta;
    const providedSlug =
      typeof meta.slug === "string" && meta.slug.trim() ? meta.slug.trim() : "";
    const slugSource = meta.name || meta.id || "template";
    const slug =
      providedSlug ||
      slugify(slugSource, { lower: true, strict: true }) ||
      createSlug(slugSource) ||
      "template";
    meta.slug = slug;
    const js = fs.existsSync(scriptPath) ? fs.readFileSync(scriptPath, "utf-8") : "";

    const values = collectDefaultValues(meta);
    const modules = deriveModules(meta);

    const renderedHtml = renderTemplate({ html, values, modules });

    const templateRootRelative = path
      .relative(uploadsDir, templateRoot)
      .replace(/\\/g, "/");

    const previewBasePath = `/templates/${templateRootRelative}/`;

    const previewHtml = disableExternalScripts(rewriteAssetPaths(renderedHtml, previewBasePath));

    fs.writeFileSync(path.join(templateRoot, "preview.html"), previewHtml, "utf-8");

    const folderName = normalizeFolderName(meta, path.basename(templateRoot));

    const stageInfo: StageInfo = {
      stageId,
      folderName,
      templateRootRelative,
      originalHtml: html,
      renderedHtml,
      css,
      js,
      meta,
    };

    fs.writeFileSync(stageInfoPath(stageDir), JSON.stringify(stageInfo), "utf-8");

    return NextResponse.json(buildPreviewResponse(stageInfo));
  } catch (error: unknown) {
    console.error("UPLOAD PREVIEW ERROR:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json<ErrorResponse>({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const stageId = typeof body?.stageId === "string" ? body.stageId : null;

    if (!stageId) {
      return NextResponse.json<ErrorResponse>({ error: "stageId is required" }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "templates");
    const stagingDir = path.join(uploadsDir, "_staging");
    const stageDir = path.join(stagingDir, stageId);

    if (fs.existsSync(stageDir)) {
      fs.rmSync(stageDir, { recursive: true, force: true });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("UPLOAD CANCEL ERROR:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json<ErrorResponse>({ error: message }, { status: 500 });
  }
}
