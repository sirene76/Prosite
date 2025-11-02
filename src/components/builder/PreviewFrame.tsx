"use client";

import React, { useEffect, useRef } from "react";
import { useBuilderStore } from "@/store/builderStore";
import { DEBUG_PREVIEW } from "@/lib/debug";

export function PreviewFrame({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { content, themeConfig } = useBuilderStore((state) => ({
    content: state.content,
    themeConfig: state.themeConfig,
  }));

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(html);
    doc.write(`
      <script>
        (function(){
          window.__IFRAME_READY__ = true;
          window.__PREVIEW_DEBUG_OVERLAY__ = ${DEBUG_PREVIEW ? "true" : "false"};
          try {
            if (window.__PREVIEW_DEBUG_OVERLAY__) {
              var box = document.createElement('div');
              box.id = '__preview_debug__';
              box.style.cssText = 'position:fixed;z-index:999999;bottom:8px;left:8px;background:rgba(0,0,0,.7);color:#fff;font:12px/1.4 monospace;padding:8px;border-radius:6px;max-width:40vw;pointer-events:none;white-space:pre-wrap';
              box.textContent = '[iframe] booted, waiting for messages…';
              document.body.appendChild(box);
              function set(t){ var el=document.getElementById('__preview_debug__'); if(el) el.textContent = t; }
              window.addEventListener('message', function(ev){
                var d=ev.data||{};
                if(!d.type) return;
                var now = new Date().toISOString().split('T')[1].replace('Z','');
                if(d.type==='update-content'){
                  set('[iframe '+now+'] got update-content; keys='+(Object.keys(d.payload||{}).slice(0,8).join(', ')||'none'));
                }
                if(d.type==='update-theme'){
                  var c = (d.payload && d.payload.colors) ? Object.keys(d.payload.colors).length : 0;
                  set('[iframe '+now+'] got update-theme; cssVars='+c);
                }
                try { parent.postMessage({type:'iframe-ack', ackOf: d.type, ok:true}, '*'); } catch(_) {}
              }, false);
            }
          } catch (e){
            try { parent.postMessage({type:'iframe-boot-error', error: String(e)}, '*'); } catch(_) {}
          }
        })();
      </script>
    `);
    doc.close();
  }, [html]);

  useEffect(() => {
    const targetWindow = iframeRef.current?.contentWindow;
    if (!targetWindow) return;
    if (DEBUG_PREVIEW) {
      console.log("[parent] posting update-content", {
        sample: Object.keys(content || {}).slice(0, 8),
        isNestedHero: !!(content?.hero && typeof content.hero === "object"),
      });
    }
    targetWindow.postMessage({ type: "update-content", payload: content }, "*");
  }, [content]);

  useEffect(() => {
    const targetWindow = iframeRef.current?.contentWindow;
    if (!targetWindow) return;
    if (DEBUG_PREVIEW) {
      console.log("[parent] posting update-theme", {
        hasColors: !!themeConfig?.colors,
        colorKeys: themeConfig?.colors ? Object.keys(themeConfig.colors) : [],
      });
    }
    targetWindow.postMessage({ type: "update-theme", payload: themeConfig }, "*");
  }, [themeConfig]);

  useEffect(() => {
    if (!DEBUG_PREVIEW) return;
    function onMessage(ev: MessageEvent) {
      if (ev.data?.type === "iframe-ack") {
        console.log("[parent] got ack from iframe:", ev.data);
      }
      if (ev.data?.type === "iframe-boot-error") {
        console.warn("[parent] iframe boot error:", ev.data.error);
      }
      if (ev.data?.type === "preview-script-loaded") {
        console.log("[parent] iframe reports preview-script loaded");
      }
      if (ev.data?.type === "preview-script-seen-content") {
        console.log("[parent] preview-script saw content keys", ev.data.keys);
      }
      if (ev.data?.type === "preview-script-seen-theme") {
        console.log("[parent] preview-script saw theme css vars", ev.data.cssVarCount);
      }
      if (ev.data?.type === "preview-script-error") {
        console.warn("[parent] preview-script error:", ev.data.error);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      className="w-full h-full border-0"
      sandbox="allow-scripts allow-same-origin"
      srcDoc={html}
    />
  );
}
