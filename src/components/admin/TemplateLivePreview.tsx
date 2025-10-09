"use client";
import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TemplateLivePreview({ html, css, meta }: any) {
  const [activeTheme, setActiveTheme] = useState(meta?.themes?.[0] || null);

  const doc = useMemo(() => {
    const theme = activeTheme?.colors || {};
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
  }, [html, css, activeTheme]);

  if (!html) return null;

  return (
    <div className="mt-8 border rounded-lg overflow-hidden shadow-lg">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-2">
        <span className="text-slate-100 text-sm font-medium">Live Preview</span>
        {meta?.themes?.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Theme:</span>
            <Select
              value={activeTheme?.name}
              onValueChange={(val) =>
                setActiveTheme(meta.themes.find((t: any) => t.name === val))
              }
            >
              <SelectTrigger className="h-8 w-36 bg-slate-800 text-slate-100 border-slate-700">
                <SelectValue placeholder="Select Theme" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 text-slate-100 border border-slate-700">
                {meta.themes.map((t: any) => (
                  <SelectItem key={t.name} value={t.name}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <iframe
        srcDoc={doc}
        className="w-full h-[600px] border-t bg-white transition-colors duration-300"
        title="Template Preview"
      />
    </div>
  );
}
