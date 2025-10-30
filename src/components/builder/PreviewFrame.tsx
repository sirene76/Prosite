"use client";

import { useEffect, useRef } from "react";

export type PreviewFrameProps = {
  html: string;
};

export default function PreviewFrame({ html }: PreviewFrameProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) {
      return;
    }

    const documentHtml = html && html.trim().length > 0 ? html : "";
    frame.srcdoc = documentHtml;
  }, [html]);

  return (
    <iframe
      ref={frameRef}
      className="h-[70vh] w-full rounded-xl border border-slate-800 bg-white shadow-inner"
      title="Website preview"
      sandbox="allow-same-origin"
    />
  );
}
