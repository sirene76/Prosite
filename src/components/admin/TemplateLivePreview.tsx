"use client";
import { useMemo } from "react";

export default function TemplateLivePreview({ html, css, meta }: any) {
  const doc = useMemo(() => {
    const theme = meta?.themes?.[0]?.colors || {};
    const styleVars = Object.entries(theme)
      .map(([k, v]) => `--${k}: ${v};`)
      .join(" ");

    return `
      <html>
        <head>
          <style>:root { ${styleVars} } ${css}</style>
        </head>
        <body>${html}</body>
      </html>
    `;
  }, [html, css, meta]);

  if (!html) return null;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-slate-900 text-slate-100 px-4 py-2 text-sm font-medium">
        Live Preview
      </div>
      <iframe
        srcDoc={doc}
        className="w-full h-[600px] border-t bg-white"
        title="Template Preview"
      />
    </div>
  );
}
