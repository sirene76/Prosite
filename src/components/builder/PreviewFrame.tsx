"use client";

import { useEffect, useMemo, useRef } from "react";

export type PreviewFrameProps = {
  html: string;
  title?: string;
};

function extractTitle(html: string) {
  if (!html) {
    return null;
  }

  const match = html.match(/<title>(.*?)<\/title>/is);
  if (!match || match.length < 2) {
    return null;
  }

  return match[1]?.replace(/\s+/g, " ").trim() ?? null;
}

export default function PreviewFrame({ html, title }: PreviewFrameProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) {
      return;
    }

    const documentHtml = html && html.trim().length > 0 ? html : "";
    frame.srcdoc = documentHtml;
  }, [html]);

  const resolvedTitle = useMemo(() => {
    if (title && title.trim().length > 0) {
      return title.trim();
    }

    const parsedTitle = extractTitle(html);
    if (parsedTitle && parsedTitle.length > 0) {
      return parsedTitle;
    }

    return "Untitled Site";
  }, [html, title]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
      <div className="relative flex h-10 items-center justify-center border-b border-slate-200 bg-slate-200">
        <div className="absolute left-4 flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-400" aria-hidden />
          <span className="h-3 w-3 rounded-full bg-yellow-400" aria-hidden />
          <span className="h-3 w-3 rounded-full bg-green-400" aria-hidden />
        </div>
        <span className="max-w-[75%] truncate text-sm font-medium text-slate-700">
          {resolvedTitle}
        </span>
      </div>
      <iframe
        ref={frameRef}
        className="h-[70vh] w-full bg-white"
        title="Website preview"
        sandbox="allow-same-origin"
      />
    </div>
  );
}
