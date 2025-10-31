"use client";
import { useEffect, useRef, useState } from "react";

export default function NewBuilderPreview({ templateHtml, data }: any) {
  const previewRef = useRef<HTMLIFrameElement>(null);
const [template, setTemplate] = useState({ html: "", css: "" });
setTemplate({ html: template.html, css: template.css });

  useEffect(() => {
    if (!previewRef.current || !templateHtml) return;
    const doc = previewRef.current.contentDocument;
    if (!doc) return;

    doc.open();
doc.write(`
  <html>
    <head>
      <style>
        body { font-family: Inter, sans-serif; margin: 0; }
        ${template.css ?? ""}
      </style>
    </head>
    <body>
      ${templateHtml
        .replace(/{{\s*title\s*}}/g, data.title)
        .replace(/{{\s*business\s*}}/g, data.business)}
    </body>
  </html>
`);

    doc.close();
  }, [templateHtml, data]);

  return (
    <div className="browser">
      <div className="browser-bar">
        <div className="browser-dots">
          <span className="dot red"></span>
          <span className="dot yellow"></span>
          <span className="dot green"></span>
        </div>
        <div className="browser-url">
          {data.logo ? (
            <img src={data.logo} alt="Logo" />
          ) : (
            <img
              src="https://dummyimage.com/16x16/3b82f6/fff.png&text=P"
              alt="Logo"
            />
          )}
          <span className="title">{data.title}</span>
        </div>
      </div>
      <iframe
        ref={previewRef}
        className="browser-screen"
        style={{ width: "100%", height: "70vh", border: "none" }}
      />
      <div className="preview-footer">
        <button className="btn-primary">Full Preview</button>
      </div>
    </div>
  );
}
