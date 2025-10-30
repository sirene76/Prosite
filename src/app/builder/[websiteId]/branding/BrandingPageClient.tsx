"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import BrandingForm, { BrandingValues } from "@/components/builder/BrandingForm";
import PreviewFrame from "@/components/builder/PreviewFrame";

export type BrandingPageClientProps = {
  websiteId: string;
  templateHtml: string;
  initialValues: BrandingValues;
  initialPreviewHtml: string;
};

export function BrandingPageClient({
  websiteId,
  templateHtml,
  initialValues,
  initialPreviewHtml,
}: BrandingPageClientProps) {
  const [values, setValues] = useState<BrandingValues>(initialValues);
  const [previewHtml, setPreviewHtml] = useState(initialPreviewHtml);
  const [isRendering, setIsRendering] = useState(false);
  const initialRenderRef = useRef(true);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  useEffect(() => {
    setPreviewHtml(initialPreviewHtml);
  }, [initialPreviewHtml]);

  useEffect(() => {
    if (!templateHtml) {
      setPreviewHtml("");
      return;
    }

    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    const renderPreview = async () => {
      try {
        setIsRendering(true);
        const response = await fetch("/api/render-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ html: templateHtml, values }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Preview request failed with status ${response.status}`);
        }

        const payload: unknown = await response.json();
        if (cancelled) {
          return;
        }
        if (
          payload &&
          typeof payload === "object" &&
          "rendered" in payload &&
          typeof (payload as { rendered: unknown }).rendered === "string"
        ) {
          setPreviewHtml((payload as { rendered: string }).rendered);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to render branding preview", error);
        }
      } finally {
        if (!cancelled) {
          setIsRendering(false);
        }
      }
    };

    renderPreview();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [templateHtml, values]);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-10 space-y-3 text-slate-800">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
          Step 2 · Add Your Brand
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">Make it yours</h1>
        <p className="max-w-2xl text-sm text-slate-500">
          Give your site a name, add your business details, and see changes update instantly in the live preview.
        </p>
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-6">
          <BrandingForm
            websiteId={websiteId}
            initialValues={initialValues}
            onChange={setValues}
          />
          <Link
            href={`/checkout/${websiteId}`}
            className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            Upgrade &amp; Launch Site
          </Link>
        </div>

        <div className="space-y-4">
          <div className="space-y-1 text-slate-800">
            <h2 className="text-lg font-semibold">Live Preview</h2>
            <p className="text-sm text-slate-500">Your website refreshes as you update your details.</p>
          </div>
          <div className="relative">
            <PreviewFrame html={previewHtml} title={values.websiteName} />
            {isRendering ? (
              <div className="absolute inset-0 rounded-2xl border border-blue-500/30 bg-blue-500/10 backdrop-blur-sm" aria-hidden>
                <div className="flex h-full items-center justify-center">
                  <span className="text-sm font-medium text-blue-700">Updating preview…</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
