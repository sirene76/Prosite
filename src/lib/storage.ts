import fs from "fs";
import path from "path";

const USE_R2 = !!process.env.CF_ACCOUNT_ID && !!process.env.CF_R2_BUCKET;

async function uploadLocal(localDir: string, websiteId: string) {
  const destDir = path.join(process.cwd(), "public", "deployments", websiteId);
  fs.mkdirSync(destDir, { recursive: true });
  const files = fs.readdirSync(localDir);
  for (const f of files) {
    fs.copyFileSync(path.join(localDir, f), path.join(destDir, f));
  }
  console.log(`🗂️ Copied deployment to /public/deployments/${websiteId}`);
  return `/deployments/${websiteId}/index.html`;
}

async function uploadToR2(localDir: string, websiteId: string) {
  const ACCOUNT_ID = process.env.CF_ACCOUNT_ID!;
  const API_TOKEN = process.env.CF_API_TOKEN!;
  const BUCKET = process.env.CF_R2_BUCKET!;
  const PUBLIC_URL = process.env.CF_R2_PUBLIC_URL!;

  const files = fs.readdirSync(localDir);
  const base = `websites/${websiteId}`;
  for (const file of files) {
    const data = fs.readFileSync(path.join(localDir, file));
    const res = await fetch(
      `https://${ACCOUNT_ID}.r2.cloudflarestorage.com/${BUCKET}/${base}/${file}`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${API_TOKEN}` },
        body: data,
      }
    );
    if (!res.ok) {
      throw new Error(`❌ R2 upload failed: ${res.status} ${res.statusText}`);
    }
  }
  return `${PUBLIC_URL}/${base}/index.html`;
}

// unified helper that auto-chooses local or R2
export async function uploadDeployment(localDir: string, websiteId: string) {
  if (USE_R2) {
    console.log("☁️  Uploading to Cloudflare R2…");
    return uploadToR2(localDir, websiteId);
  } else {
    console.log("💾  R2 disabled — keeping local deployment.");
    return uploadLocal(localDir, websiteId);
  }
}
