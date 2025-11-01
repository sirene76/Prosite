"use client";

import React, { useEffect, useRef } from "react";
import { useBuilderStore } from "@/store/builderStore";

export function PreviewFrame({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { content, theme } = useBuilderStore();

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument!;
    doc.open();
    doc.write(html);
    doc.close();
  }, [html]);

  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "update-content", payload: content },
      "*"
    );
  }, [content]);

  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "update-theme", payload: theme },
      "*"
    );
  }, [theme]);

  return (
    <iframe
      ref={iframeRef}
      className="w-full h-full border-0"
      sandbox="allow-scripts allow-same-origin"
      srcDoc={html}
    />
  );
}
