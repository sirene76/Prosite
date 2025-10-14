import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
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

    await connectDB();

    const uploadsDir = path.join(process.cwd(), "public", "templates");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const tempPath = path.join(uploadsDir, `${Date.now()}-upload.zip`);
    fs.writeFileSync(tempPath, buffer);

    const zip = new AdmZip(tempPath);
    const folderName = path.basename(tempPath, ".zip");
    const extractDir = path.join(uploadsDir, folderName);
    zip.extractAllTo(extractDir, true);
    fs.unlinkSync(tempPath);

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

    const image =
      meta.image && meta.image.startsWith("http")
        ? meta.image
        : `/templates/${folderName}/${meta.image || "assets/hero.jpg"}`;

    const templateDoc = await Template.create({
      name: meta.name,
      category: meta.category || "Uncategorized",
      description: meta.description || "",
      image,
      html,
      css,
      js,
      meta,
    });

    return NextResponse.json({ success: true, template: templateDoc });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
