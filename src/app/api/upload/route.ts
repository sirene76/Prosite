import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  const ext = path.extname(file.name);
  const base = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
  const safeName = `${base}_${Date.now()}${ext}`;

  const filePath = path.join(uploadDir, safeName);
  await fs.writeFile(filePath, buffer);

  const url = `/uploads/${safeName}`;
  return NextResponse.json({ url });
}
