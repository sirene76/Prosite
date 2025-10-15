import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

import { connectDB } from "@/lib/mongodb";
import { Template } from "@/models/template";
import { createSlug } from "@/app/api/admin/templates/utils";
import slugify from "slugify";

import type { TemplateMeta } from "@/types/template";

type StageInfo = {
  stageId: string;
  folderName: string;
  templateRootRelative: string;
  renderedHtml: string;
  css: string;
  js: string;
  meta: TemplateMeta & {
    image?: string;
  };
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
    basePath: string;
    previewPath: string;
  };
};

const REQUIRED_FILES = ["index.html", "style.css", "meta.json"] as const;

function stageInfoPath(stageDir: string): string {
  return path.join(stageDir, "__stage.json");
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

function ensureHasCoreFiles(templateRoot: string) {
  for (const file of REQUIRED_FILES) {
    const filePath = path.join(templateRoot, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing required file: ${file}`);
    }
  }
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

function computeImageUrl(meta: StageInfo["meta"], finalBasePath: string) {
  if (meta.image && meta.image.startsWith("http")) {
    return meta.image;
  }

  const imagePath = meta.image || "assets/hero.jpg";
  return `${finalBasePath}${imagePath}`;
}

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as FinalizeRequest;
    const stageId = typeof body.stageId === "string" ? body.stageId : null;

    if (!stageId) {
      return NextResponse.json<ErrorResponse>({ error: "stageId is required" }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "templates");
    const stagingDir = path.join(uploadsDir, "_staging");
    const stageDir = path.join(stagingDir, stageId);
    const infoPath = stageInfoPath(stageDir);

    if (!fs.existsSync(infoPath)) {
      return NextResponse.json<ErrorResponse>({ error: "Upload stage not found" }, { status: 404 });
    }

    const info = JSON.parse(fs.readFileSync(infoPath, "utf-8")) as StageInfo;

    const templateRoot = path.join(uploadsDir, info.templateRootRelative);
    ensureHasCoreFiles(templateRoot);

    const finalFolderName = createSlug(info.folderName) || info.folderName;
    const finalDir = path.join(uploadsDir, finalFolderName);
    const finalBasePath = `/templates/${finalFolderName}/`;

    const sanitizedHtml = disableExternalScripts(rewriteAssetPaths(info.renderedHtml, finalBasePath));

    if (fs.existsSync(finalDir)) {
      fs.rmSync(finalDir, { recursive: true, force: true });
    }

    const stageInfoInsideTemplate = path.join(templateRoot, "__stage.json");
    if (fs.existsSync(stageInfoInsideTemplate)) {
      fs.rmSync(stageInfoInsideTemplate, { force: true });
    }

    fs.mkdirSync(finalDir, { recursive: true });
    fs.cpSync(templateRoot, finalDir, { recursive: true });

    fs.writeFileSync(path.join(finalDir, "preview.html"), sanitizedHtml, "utf-8");

    if (fs.existsSync(stageDir)) {
      fs.rmSync(stageDir, { recursive: true, force: true });
    }

    await connectDB();

    const templateName = normalizeTemplateName(info, body.nameOverride ?? null);
    const category = typeof info.meta?.category === "string" ? info.meta.category : "Uncategorized";
    const description = typeof info.meta?.description === "string" ? info.meta.description : "";
    const image = computeImageUrl(info.meta, finalBasePath);

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
      },
      { new: true, upsert: true }
    );

    const response = {
      success: true as const,
      template: {
        name: templateDoc?.name ?? templateName,
        category: templateDoc?.category ?? category,
        description: templateDoc?.description ?? description,
        meta: info.meta,
        basePath: finalBasePath,
        previewPath: `${finalBasePath}preview.html`,
      },
    } satisfies TemplateResponse;

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("UPLOAD FINALIZE ERROR:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json<ErrorResponse>({ error: message }, { status: 500 });
  }
}
