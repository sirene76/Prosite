import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { connectDB } from "@/lib/mongodb";
import Website from "@/models/Website";
import { Template } from "@/models/template"; // ✅ fix import
import fs from "fs";
import path from "path";
import { renderTemplate } from "@/lib/renderTemplate";
import "dotenv/config";

async function debugDeployInfo(websiteId: string) {
  console.log("🔍 Debugging deployment info for:", websiteId);
  await connectDB();
  
const website = await Website.findById(websiteId).lean() as any;
if (!website) {
  console.error("❌ Website not found");
  return;
}

const template = await Template.findById(website.templateId).lean() as any;
if (!template) {
  console.error("❌ Template not found");
  return;
}


  console.log("\n=== 🧩 WEBSITE VALUES ===");
  console.log(JSON.stringify(website.values, null, 2));

  console.log("\n=== 🧱 TEMPLATE PLACEHOLDERS (first 15) ===");
  const matches = template.html?.match(/{{(.*?)}}/g) || [];
  console.log(matches.slice(0, 15));

  console.log("\n=== 🧬 TEST RENDER PREVIEW ===");
  const testHtml = renderTemplate({
    html: template.html,
    values: website.values || {},
    modules: template.modules || [],
  });
  console.log(testHtml.substring(0, 500));

  console.log("\n=== 📦 TEMPLATE ASSET FOLDER CHECK ===");
  const assetsDir = path.join(process.cwd(), "public", "templates", template._id.toString(), "assets");
  console.log("Assets directory:", assetsDir);

  if (fs.existsSync(assetsDir)) {
    const assets = fs.readdirSync(assetsDir);
    console.log("Asset files found:", assets.slice(0, 10));
  } else {
    console.warn("⚠️ No assets directory found for this template.");
  }

  console.log("\n=== ☁️ R2 DEPLOYMENT SUMMARY ===");
  console.log(website.deployment?.url || "⚠️ No deployment URL saved");

  console.log("\n✅ Done. Review logs above to see what’s missing.");
}

const websiteId = process.argv[2];
if (!websiteId) {
  console.error("Usage: pnpm tsx scripts/debugDeployInfo.ts <websiteId>");
  process.exit(1);
}

debugDeployInfo(websiteId).then(() => process.exit(0));
