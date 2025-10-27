import fs from "fs";
import path from "path";

const rootDir = path.join(process.cwd(), "src");

function scanDir(dir: string, pattern: RegExp, results: string[] = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      scanDir(fullPath, pattern, results);
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      const content = fs.readFileSync(fullPath, "utf8");
      if (pattern.test(content)) results.push(fullPath);
    }
  }
  return results;
}

function extractContext(file: string, keyword: string) {
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");
  const out: string[] = [];
  lines.forEach((line, i) => {
    if (line.includes(keyword)) {
      const context = lines.slice(Math.max(0, i - 3), i + 4).join("\n");
      out.push(`\n\n=== ${file}:${i + 1} ===\n${context}`);
    }
  });
  return out.join("\n");
}

(async () => {
  console.log("🔍 Scanning for website update calls...");
  const hits = scanDir(rootDir, /\/api\/websites/);
  if (hits.length === 0) {
    console.log("❌ No fetch/axios calls to /api/websites found.");
    process.exit(0);
  }

  console.log(`✅ Found ${hits.length} file(s) containing '/api/websites':`);
  hits.forEach((f) => console.log(" -", f));

  console.log("\n📄 Extracting surrounding context of fetch calls...");
  for (const file of hits) {
    const ctx1 = extractContext(file, "fetch");
    const ctx2 = extractContext(file, "axios");
    if (ctx1 || ctx2) {
      console.log(ctx1 || ctx2);
    }
  }

  console.log("\n✅ Done. Review above logs to see what each function sends in request body.");
})();
