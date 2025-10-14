import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import type { TemplateMeta } from "@/types/template";

export const runtime = "nodejs";

type UploadedTemplate = {
  id: string;
  name?: string;
  html: string;
  css: string;
  js: string;
  meta: TemplateMeta & Record<string, unknown>;
  basePath: string; // where assets were extracted
};

export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const file = data.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    // Ensure uploads base dir exists
    const uploadsDir = path.join(process.cwd(), "public", "templates");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    // Save uploaded zip temporarily
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempZipPath = path.join(uploadsDir, `${Date.now()}-upload.zip`);
    fs.writeFileSync(tempZipPath, buffer);

    // Extract to a timestamped folder
    const folderName = path.basename(tempZipPath, ".zip");
    const extractDir = path.join(uploadsDir, folderName);

    const zip = new AdmZip(tempZipPath);
    zip.extractAllTo(extractDir, true);
    fs.unlinkSync(tempZipPath);

    // Helpers to resolve paths both in root and nested cases
    const findFile = (candidates: string[]) => candidates.find((candidate) => fs.existsSync(candidate));

    const indexPath = findFile([
      path.join(extractDir, "index.html"),
    ]) || "";

    const stylePath = findFile([
      path.join(extractDir, "style.css"),
    ]) || "";

    const scriptPath = findFile([
      path.join(extractDir, "script.js"),
    ]) || "";

    const metaPath = findFile([
      path.join(extractDir, "meta.json"),
    ]) || "";

    if (!indexPath || !stylePath || !metaPath) {
      return NextResponse.json(
        { error: "index.html, style.css, and meta.json are required in the ZIP root." },
        { status: 400 }
      );
    }

    const html = fs.readFileSync(indexPath, "utf8");
    const css = fs.readFileSync(stylePath, "utf8");
    const js = scriptPath && fs.existsSync(scriptPath) ? fs.readFileSync(scriptPath, "utf8") : "";
    const metaRaw = fs.readFileSync(metaPath, "utf8");

    const parsedMeta = parseMeta(metaRaw);
    if (!parsedMeta.success) {
      return NextResponse.json({ error: parsedMeta.error }, { status: 400 });
    }

    const meta = parsedMeta.meta;

    const payload: UploadedTemplate = {
      id: typeof meta.id === "string" && meta.id.trim() ? meta.id : folderName,
      name: typeof meta.name === "string" && meta.name.trim() ? meta.name : undefined,
      html,
      css,
      js,
      meta,
      basePath: `/templates/${folderName}`,
    };

    // NOTE: In production you should persist payload in DB and upload assets to S3.
    return NextResponse.json({ success: true, template: payload });
  } catch (err: unknown) {
    console.error("UPLOAD ERROR:", err);
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function parseMeta(metaRaw: string):
  | { success: true; meta: TemplateMeta & Record<string, unknown> }
  | { success: false; error: string } {
  try {
    const parsed = JSON.parse(metaRaw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return { success: false, error: "meta.json must be a JSON object" };
    }

    return { success: true, meta: parsed as TemplateMeta & Record<string, unknown> };
  } catch (error) {
    const message = error instanceof Error ? error.message : "meta.json is not valid JSON";
    return { success: false, error: message };
  }
}
