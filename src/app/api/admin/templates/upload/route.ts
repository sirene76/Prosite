import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { connectDB } from "@/lib/mongodb";
import { Template } from "@/models/template";
import { generateThumbnail } from "@/lib/generateThumbnail";

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

    const html = fs.readFileSync(indexPath, "utf8");
    const css = fs.readFileSync(stylePath, "utf8");
    const js = fs.existsSync(scriptPath) ? fs.readFileSync(scriptPath, "utf8") : "";
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));

    const folderName =
      (typeof meta.id === "string" && meta.id.trim()) || extractedFolderName;
    const finalDir = path.join(uploadsDir, folderName);

    if (finalDir !== extractDir) {
      if (fs.existsSync(finalDir)) {
        fs.rmSync(finalDir, { recursive: true, force: true });
      }
      fs.renameSync(extractDir, finalDir);
    }

    // 🖼️ Generate screenshot thumbnail
    const previewUrl = await generateThumbnail({
      id: folderName,
      html,
      css,
      js,
    });

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
        html,
        css,
        js,
        meta,
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, template: templateDoc });
  } catch (error: unknown) {
    console.error("UPLOAD ERROR:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
