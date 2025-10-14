import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import puppeteer from "puppeteer";
import { connectDB } from "@/lib/mongodb";
import { Template } from "@/models/template";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
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
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempPath = path.join(uploadsDir, `${Date.now()}-upload.zip`);
    fs.writeFileSync(tempPath, buffer);

    // 📦 Extract ZIP
    const zip = new AdmZip(tempPath);
    const folderName = path.basename(tempPath, ".zip");
    const extractDir = path.join(uploadsDir, folderName);
    zip.extractAllTo(extractDir, true);
    fs.unlinkSync(tempPath);

    // 🧾 Read required files
    const indexPath = path.join(extractDir, "index.html");
    const stylePath = path.join(extractDir, "style.css");
    const scriptPath = path.join(extractDir, "script.js");
    const metaPath = path.join(extractDir, "meta.json");

    if (!fs.existsSync(indexPath) || !fs.existsSync(stylePath) || !fs.existsSync(metaPath)) {
      return NextResponse.json({ error: "index.html, style.css, and meta.json required" }, { status: 400 });
    }

    const html = fs.readFileSync(indexPath, "utf8");
    const css = fs.readFileSync(stylePath, "utf8");
    const js = fs.existsSync(scriptPath) ? fs.readFileSync(scriptPath, "utf8") : "";
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));

    // 🖼️ Generate screenshot thumbnail
    const previewPath = path.join(extractDir, "preview.png");
    const previewUrl = `/templates/${folderName}/preview.png`;

    try {
      const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();

      const renderHTML = `
        <html>
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>${css}</style>
          </head>
          <body>${html}<script>${js}</script></body>
        </html>
      `;

      await page.setViewport({ width: 1280, height: 800 });
      await page.setContent(renderHTML, { waitUntil: "networkidle0" });

      await page.screenshot({
        path: previewPath,
        type: "png",
        fullPage: true,
      });

      await browser.close();
      console.log(`✅ Screenshot saved at ${previewPath}`);
    } catch (thumbErr) {
      console.warn("⚠️ Thumbnail generation failed:", thumbErr);
    }

    // 🧩 Fallback image
    const image =
      fs.existsSync(previewPath)
        ? previewUrl
        : meta.image && meta.image.startsWith("http")
        ? meta.image
        : `/templates/${folderName}/${meta.image || "assets/hero.jpg"}`;

    // 🧠 Save Template to MongoDB
    const slug = (meta.slug as string | undefined)?.trim() || folderName;

    const templateDoc = await Template.create({
      name: meta.name || folderName,
      slug,
      category: meta.category || "Uncategorized",
      description: meta.description || "",
      thumbnail: image,
      html,
      css,
      js,
      meta,
    });

    return NextResponse.json({ success: true, template: templateDoc });
  } catch (error: any) {
    console.error("UPLOAD ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
