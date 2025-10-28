// 🗂️ File: scripts/backfillWebsiteValues.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import "dotenv/config";

import { connectDB } from "@/lib/mongodb";
import Website from "@/models/Website";
import { Template } from "@/models/template"; // ✅ FIX: capital T and default import

async function backfillValues() {
  console.log("🔄 Starting website.values backfill...");
  await connectDB();

  const websites = await Website.find({
    $or: [{ values: { $exists: false } }, { values: {} }],
  }).lean();

  if (websites.length === 0) {
    console.log("✅ All websites already have values.");
    return;
  }

  for (const site of websites) {
    console.log(`\n🧩 Processing website: ${site._id} (${site.name})`);
const template = (await Template.findById(site.templateId).lean()) as any;

if (!template) {
  console.warn(`⚠️ Template not found for website ${site._id}`);
  continue;
}

const rawFields = Array.isArray(template.meta?.fields)
  ? template.meta!.fields
  : [];

if (rawFields.length === 0) {
  console.warn(`⚠️ Invalid or missing meta.fields for template ${template._id}`);
  continue;
}

const newValues: Record<string, string> = {};
for (const field of rawFields) {
  if (!field?.id) continue;
  newValues[field.id] = field.default ?? "";
}


    await Website.findByIdAndUpdate(site._id, { values: newValues }, { new: true });
    console.log(`✅ Backfilled ${Object.keys(newValues).length} fields for ${site.name}`);
  }

  console.log("\n🎉 Backfill completed!");
  process.exit(0);
}

backfillValues().catch((err) => {
  console.error("❌ Backfill error:", err);
  process.exit(1);
});
