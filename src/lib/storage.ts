// src/lib/storage.ts
import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const USE_R2 = !!process.env.CF_ACCOUNT_ID && !!process.env.CF_R2_BUCKET;

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CF_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CF_R2_SECRET_ACCESS_KEY!,
  },
});

async function uploadToR2(localDir: string, websiteId: string) {
  const files = fs.readdirSync(localDir);
  const base = `websites/${websiteId}`;
  for (const file of files) {
    const data = fs.readFileSync(path.join(localDir, file));
    const key = `${base}/${file}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.CF_R2_BUCKET!,
        Key: key,
        Body: data,
        ContentType: file.endsWith(".html")
          ? "text/html"
          : file.endsWith(".css")
          ? "text/css"
          : "application/octet-stream",
      })
    );
    console.log(`☁️  Uploaded ${key}`);
  }
  return `${process.env.CF_R2_PUBLIC_URL}/${base}/index.html`;
}

export async function uploadDeployment(localDir: string, websiteId: string) {
  if (!USE_R2) {
    const destDir = path.join(process.cwd(), "public", "deployments", websiteId);
    fs.mkdirSync(destDir, { recursive: true });
    for (const f of fs.readdirSync(localDir)) {
      fs.copyFileSync(path.join(localDir, f), path.join(destDir, f));
    }
    console.log(`💾 Local deployment kept at /public/deployments/${websiteId}`);
    return `/deployments/${websiteId}/index.html`;
  }

  return uploadToR2(localDir, websiteId);
}
