import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { connectDB } from "@/lib/mongodb";
import { Template } from "@/models/template";
import { renderTemplate } from "@/lib/renderTemplate";

type UploadedTemplateField = {
  default?: unknown;
};

type UploadedTemplateModule = {
  id?: unknown;
  label?: unknown;
  description?: unknown;
};

type UploadedTemplateMeta = {
  id?: string;
  name?: string;
  category?: string;
  description?: string;
  image?: string;
  fields?: Record<string, UploadedTemplateField>;
  modules?: UploadedTemplateModule[];
  [key: string]: unknown;
};

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    console.log("⚙️ Starting upload...");
    const data = await req.formData();
    const file = data.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    // 🧱 Connect to MongoDB
    await connectDB();

    // 📁 Prepare directories
    const uploadsDir = path.join(process.cwd(), "public", "templates");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    // 💾 Save uploaded ZIP temporarily
    console.log("📥 Received file:", file.name, file.size, "bytes");
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempPath = path.join(uploadsDir, `${Date.now()}-upload.zip`);
    console.log("📝 Writing temp ZIP to:", tempPath);
    fs.writeFileSync(tempPath, buffer);

    // 📦 Extract ZIP
    const extractedFolderName = path.basename(tempPath, ".zip");
    const extractDir = path.join(uploadsDir, extractedFolderName);

    if (fs.existsSync(extractDir)) {
      fs.rmSync(extractDir, { recursive: true, force: true });
    }

    try {
      console.log("📂 Extracting zip to:", extractDir);
      const zip = new AdmZip(tempPath);
      const entries = zip.getEntries();
      console.log("📦 ZIP entries:", entries.map((entry) => entry.entryName));
      if (!entries.length) throw new Error("Empty or unreadable ZIP");
      zip.extractAllTo(extractDir, true);
      console.log("✅ Extracted successfully");
    } finally {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }

    // 🧾 Read required files
    console.log("📦 Checking extracted files...");
    let indexPath = path.join(extractDir, "index.html");
    let stylePath = path.join(extractDir, "style.css");
    let metaPath = path.join(extractDir, "meta.json");

    if (!fs.existsSync(indexPath)) {
      const subDirs = fs
        .readdirSync(extractDir)
        .filter((f) => fs.statSync(path.join(extractDir, f)).isDirectory());
      if (subDirs.length > 0) {
        const innerDir = path.join(extractDir, subDirs[0]);
        indexPath = path.join(innerDir, "index.html");
        stylePath = path.join(innerDir, "style.css");
        metaPath = path.join(innerDir, "meta.json");
      }
    }

    if (!fs.existsSync(indexPath) || !fs.existsSync(stylePath) || !fs.existsSync(metaPath)) {
      console.error("❌ Missing core files", { indexPath, stylePath, metaPath });
      return NextResponse.json(
        { error: "index.html, style.css, and meta.json required" },
        { status: 400 }
      );
    }

    console.log("✅ Found index.html, style.css, and meta.json");

    const scriptPath = path.join(path.dirname(indexPath), "script.js");

    // Read extracted files
    const html = fs.readFileSync(indexPath, "utf-8");
    const css = fs.readFileSync(stylePath, "utf-8");
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8")) as UploadedTemplateMeta;

    // Collect default values
    const values: Record<string, string> = {};
    if (meta.fields) {
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
    }

    // Default module placeholders
    const modules =
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
      }) || [];

    // Render full HTML
    const renderedHtml = renderTemplate({ html, values, modules });

    const folderName =
      (typeof meta.id === "string" && meta.id.trim()) || extractedFolderName;

    // ✅ FIX: Compute basePath robustly (Windows-safe)
    const [subfolder] = fs.readdirSync(extractDir).filter((n) => !n.startsWith("."));
    const extractDirName = path.basename(extractDir).replace(/\\/g, "/");
    const shouldRename = folderName !== extractedFolderName;
    const baseDirName = shouldRename ? folderName : extractDirName;
    const basePath = `/templates/${baseDirName}/${subfolder}/`;

    // ✅ Rewrite relative asset URLs to absolute preview URLs
    const fixedHtmlWithPaths = renderedHtml
      .replace(/href="style\.css"/g, `href="${basePath}style.css"`)
      .replace(/src="script\.js"/g, `src="${basePath}script.js"`)
      .replace(/src="images\//g, `src="${basePath}images/`)
      .replace(/src="assets\//g, `src="${basePath}assets/`);

    // 🛡️ Strip potentially dangerous script tags
    const fixedHtml = fixedHtmlWithPaths.replace(
      /<script\b[^>]*\bsrc\s*=\s*(?:"([^"]*script\.js)"|'([^']*script\.js)')[^>]*>\s*<\/script>/gi,
      (_match, doubleQuotedSrc: string, singleQuotedSrc: string) => {
        const srcPath = doubleQuotedSrc || singleQuotedSrc || "";
        return `<noscript data-disabled-script="${srcPath}"></noscript>`;
      }
    );

    // Save the final preview
    const previewPath = path.join(extractDir, "preview.html");
    fs.writeFileSync(previewPath, fixedHtml, "utf-8");
    console.log("✅ Preview HTML rendered:", previewPath);
    console.log("✅ Base path for preview:", basePath);

    // 🧩 Optional: Disable Puppeteer thumbnail generation safely
    try {
      if (process.env.ENABLE_THUMBNAILS === "true") {
        const { generateThumbnail } = await import("@/lib/generateThumbnail");
        await generateThumbnail({ id: extractDirName, html: renderedHtml, css });
      } else {
        console.log("⚙️ Skipping Puppeteer thumbnail (ENABLE_THUMBNAILS not set).");
      }
    } catch (err: unknown) {
      console.warn(
        "⚠️ Thumbnail generation skipped:",
        err instanceof Error ? err.message : err
      );
    }

    let previewUrl: string | undefined;

    const js = fs.existsSync(scriptPath) ? fs.readFileSync(scriptPath, "utf-8") : "";

    const finalDir = path.join(uploadsDir, folderName);

    if (finalDir !== extractDir) {
      if (fs.existsSync(finalDir)) {
        fs.rmSync(finalDir, { recursive: true, force: true });
      }
      fs.renameSync(extractDir, finalDir);
    }

    // 🧩 Fallback image
    const image =
      previewUrl ||
      (meta.image && meta.image.startsWith("http")
        ? meta.image
        : `/templates/${folderName}/${meta.image || "assets/hero.jpg"}`);

    const templateName = meta.name || folderName;

    // 🧠 Save Template to MongoDB
    const templateDoc = await Template.findOneAndUpdate(
      { name: templateName },
      {
        name: templateName,
        category: meta.category || "Uncategorized",
        description: meta.description || "",
        image,
        published: true,
        html: fixedHtml,
        css,
        js,
        meta,
      },
      { new: true, upsert: true }
    );

    const templateBasePath = `/templates/${folderName}`;
    const responseTemplate = templateDoc?.toObject
      ? {
          ...templateDoc.toObject(),
          basePath: templateBasePath,
          previewPath: `${templateBasePath}/preview.html`,
        }
      : {
          ...templateDoc,
          basePath: templateBasePath,
          previewPath: `${templateBasePath}/preview.html`,
        };

    return NextResponse.json({ success: true, template: responseTemplate });
  } catch (error: unknown) {
    console.error("UPLOAD ERROR:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
