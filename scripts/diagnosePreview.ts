import fs from "fs";
import path from "path";

type Finding = { title: string; ok: boolean; detail?: string };

function exists(p: string) {
  return fs.existsSync(p) && fs.statSync(p).isFile();
}
function read(p: string) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

const findings: Finding[] = [];

const paths = {
  store: "src/store/builderStore.ts",
  frame: "src/components/builder/PreviewFrame.tsx",
  previewScript: "public/preview-script.js",
  builderPage: "src/app/builder/[websiteId]/BuilderPageClient.tsx",
};

for (const k of Object.keys(paths) as (keyof typeof paths)[]) {
  const p = paths[k];
  const fileExists = exists(p);
  findings.push({ title: `File exists: ${p}`, ok: fileExists, detail: fileExists ? "OK" : "Missing" });
}

const frameSrc = read(paths.frame);
if (frameSrc) {
  findings.push({
    title: "iframe sandbox allows scripts + same-origin",
    ok: /sandbox=.*allow-scripts/.test(frameSrc) && /sandbox=.*allow-same-origin/.test(frameSrc),
    detail: frameSrc.match(/sandbox="([^"]+)"/)?.[1] || "sandbox attr not found",
  });
  findings.push({
    title: "posts update-content",
    ok: /postMessage\(\s*\{\s*type:\s*["']update-content["']/.test(frameSrc),
  });
  findings.push({
    title: "posts update-theme",
    ok: /postMessage\(\s*\{\s*type:\s*["']update-theme["']/.test(frameSrc),
  });
}

const storeSrc = read(paths.store);
if (storeSrc) {
  findings.push({
    title: "store has nested setContent",
    ok: /setContent:\s*\(key,\s*value\)\s*=>\s*set\(\(state\)\s*=>/.test(storeSrc),
  });
  findings.push({
    title: "uses lodash.set (or equivalent)",
    ok: /lodash\.set|from\s+"lodash\.set"|from\s+"lodash"\s*;.*\bset\(/s.test(storeSrc),
  });
  findings.push({
    title: "has initialize() loader",
    ok: /initialize:\s*async\s*\(\{?\s*websiteId/.test(storeSrc),
  });
}

const previewScriptSource = read(paths.previewScript);
if (previewScriptSource) {
  findings.push({
    title: "preview-script has message listener",
    ok: /addEventListener\(\s*["']message["']/.test(previewScriptSource),
  });
}

const outDir = path.join(process.cwd(), "diagnostics");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const lines = [
  "# Prosite Builder Preview – Diagnostics Report",
  "",
  "Generated: " + new Date().toISOString(),
  "",
  "## Findings",
  ...findings.map((f) => `- **${f.ok ? "✅" : "❌"} ${f.title}**${f.detail ? ` — ${f.detail}` : ""}`),
  "",
  "## Next steps (collect runtime logs)",
  "- Run with `NEXT_PUBLIC_DEBUG_PREVIEW=1` and reproduce the issue.",
  "- Open DevTools **Console** (parent) and copy logs from:",
  "  - `[parent] posting update-content` / `[parent] posting update-theme`",
  "  - `[parent] got ack from iframe`",
  "  - any `preview-script-*` messages",
  "- Also copy what the small black overlay inside the preview iframe says.",
  "",
  "Paste everything back to ChatGPT.",
];

fs.writeFileSync(path.join(outDir, "preview_report.md"), lines.join("\n"), "utf8");
console.log("Wrote diagnostics/preview_report.md with", findings.length, "findings.");
