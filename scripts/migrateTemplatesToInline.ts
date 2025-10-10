import { connectDB } from "@/lib/mongodb";
import { Template } from "@/models/template";

async function migrateTemplatesToInline() {
  await connectDB();
  const templates = await Template.find({
    $or: [
      { htmlUrl: { $exists: true, $ne: null } },
      { cssUrl: { $exists: true, $ne: null } },
      { metaUrl: { $exists: true, $ne: null } },
    ],
  });

  console.log(`🧩 Found ${templates.length} templates to migrate.`);

  for (const tpl of templates) {
    let html = tpl.html;
    let css = tpl.css;
    let meta = tpl.meta;

    try {
      if (!html && tpl.htmlUrl) {
        const res = await fetch(tpl.htmlUrl);
        html = await res.text();
      }
      if (!css && tpl.cssUrl) {
        const res = await fetch(tpl.cssUrl);
        css = await res.text();
      }
      if (!meta && tpl.metaUrl) {
        const res = await fetch(tpl.metaUrl);
        meta = await res.json();
      }

      await Template.findByIdAndUpdate(tpl._id, {
        $set: { html, css, meta },
        $unset: { htmlUrl: "", cssUrl: "", metaUrl: "" },
      });

      console.log(`✅ Migrated: ${tpl.name}`);
    } catch (err) {
      console.error(`❌ Failed to migrate ${tpl.name}:`, err);
    }
  }

  console.log("🎉 Migration complete!");
  process.exit(0);
}

migrateTemplatesToInline().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
