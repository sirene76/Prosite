# Prosite Builder Preview – Diagnostics Report

Generated: 2025-11-01T22:12:08.870Z

## Findings
- **✅ File exists: src/store/builderStore.ts** — OK
- **✅ File exists: src/components/builder/PreviewFrame.tsx** — OK
- **✅ File exists: public/preview-script.js** — OK
- **✅ File exists: src/app/builder/[websiteId]/BuilderPageClient.tsx** — OK
- **✅ iframe sandbox allows scripts + same-origin** — allow-scripts allow-same-origin
- **✅ posts update-content**
- **✅ posts update-theme**
- **✅ store has nested setContent**
- **✅ uses lodash.set (or equivalent)**
- **❌ has initialize() loader**
- **✅ preview-script has message listener**

## Next steps (collect runtime logs)
- Run with `NEXT_PUBLIC_DEBUG_PREVIEW=1` and reproduce the issue.
- Open DevTools **Console** (parent) and copy logs from:
  - `[parent] posting update-content` / `[parent] posting update-theme`
  - `[parent] got ack from iframe`
  - any `preview-script-*` messages
- Also copy what the small black overlay inside the preview iframe says.

Paste everything back to ChatGPT.
