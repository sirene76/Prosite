"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";

import type { TemplateMeta } from "@/types/template";

type ThemeOption = {
  name: string;
  colors: Record<string, string>;
  fonts?: Record<string, string>;
};

function normaliseThemes(meta: TemplateMeta | null | undefined): ThemeOption[] {
  const source = (meta as { themes?: unknown })?.themes;

  if (!Array.isArray(source)) {
    return [];
  }

  return source
    .map((theme) => {
      if (
        theme &&
        typeof theme === "object" &&
        typeof (theme as { name?: unknown }).name === "string" &&
        typeof (theme as { colors?: unknown }).colors === "object" &&
        (theme as { colors?: unknown }).colors !== null
      ) {
        const colors: Record<string, string> = {};
        Object.entries((theme as { colors: Record<string, unknown> }).colors).forEach(([key, value]) => {
          if (typeof value === "string" && value.trim()) {
            colors[key] = value;
          }
        });

        const fonts: Record<string, string> = {};
        const sourceFonts = (theme as { fonts?: Record<string, unknown> }).fonts;
        if (sourceFonts && typeof sourceFonts === "object") {
          Object.entries(sourceFonts).forEach(([key, value]) => {
            if (typeof value === "string" && value.trim()) {
              fonts[key] = value;
            }
          });
        }

        return {
          name: (theme as { name: string }).name,
          colors,
          fonts,
        } satisfies ThemeOption;
      }

      return null;
    })
    .filter((theme): theme is ThemeOption => Boolean(theme));
}

type TemplatePreview = {
  name?: string | null;
  category?: string | null;
  description?: string | null;
  meta?: TemplateMeta | null;
  basePath?: string | null;
  previewPath?: string | null;
  stageId?: string | null;
};

export default function AddTemplatePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [template, setTemplate] = useState<TemplatePreview | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [themes, setThemes] = useState<ThemeOption[]>([]);
  const [activeThemeId, setActiveTheme] = useState<string | null>(null);
  const router = useRouter();

  const activeTheme = useMemo(
    () => themes.find((theme) => theme.name === activeThemeId) ?? (themes.length ? themes[0] : null),
    [activeThemeId, themes],
  );

  function applyThemeToDocument(doc: Document | null, theme: ThemeOption | null) {
    if (!doc || !theme) return;

    const root = doc.documentElement;
    if (!root) return;

    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });

    if (theme.fonts) {
      Object.entries(theme.fonts).forEach(([key, value]) => {
        root.style.setProperty(`--font-${key}`, value);
      });
    }
  }

  useEffect(() => {
    const iframe = iframeRef.current;
    const theme = activeTheme;

    if (!iframe || !theme) return;

    const applyTheme = () => {
      applyThemeToDocument(iframe.contentDocument, theme);
    };

    const handleLoad = () => {
      applyTheme();
    };

    iframe.addEventListener("load", handleLoad);

    if (iframe.contentDocument?.readyState === "complete") {
      applyTheme();
    }

    return () => {
      iframe.removeEventListener("load", handleLoad);
    };
  }, [activeTheme, previewSrc]);

  function resetState() {
    setTemplate(null);
    setPreviewSrc(null);
    setStatus("");
    setThemes([]);
    setActiveTheme(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");
    setStatus("");
    setTemplate(null);
    setPreviewSrc(null);
    setThemes([]);
    setActiveTheme(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/templates/upload", { method: "POST", body: formData });
      const data: { success?: boolean; template?: TemplatePreview; error?: string } = await res.json();

      if (res.ok && data.success && data.template) {
        setTemplate(data.template);
        setPreviewSrc(data.template.previewPath ?? null);
        const themeOptions = normaliseThemes(data.template.meta ?? null);
        setThemes(themeOptions);
        setActiveTheme(themeOptions.length ? themeOptions[0].name : null);
        setStatus("Preview ready. Review and save when you're ready.");
      } else {
        setError(data.error || "Upload failed");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!template?.stageId) return;

    setSaving(true);
    setError("");
    setStatus("");

    try {
      const res = await fetch("/api/admin/templates/upload/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId: template.stageId }),
      });
      const data: { success?: boolean; template?: TemplatePreview; error?: string } = await res.json();

      if (res.ok && data.success && data.template) {
        router.push("/admin/templates");
        return;
      } else {
        setError(data.error || "Failed to save template");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel() {
    if (!template?.stageId) {
      resetState();
      return;
    }

    setCancelling(true);
    setError("");
    setStatus("");

    try {
      const res = await fetch("/api/admin/templates/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId: template.stageId }),
      });

      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to cancel upload");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
    } finally {
      resetState();
      setCancelling(false);
    }
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Add New Template</h1>
      <div className="bg-white shadow rounded-md p-6 space-y-6">
        <div>
          <label className="block font-medium mb-2">Upload Template (.zip)</label>
          <input
            type="file"
            accept=".zip"
            ref={fileInputRef}
            onChange={handleUpload}
            className="block w-full text-sm border border-gray-300 rounded-md p-2"
          />
        </div>
        {loading && <p className="text-gray-600">Processing upload...</p>}
        {status && !error && <p className="text-green-600">{status}</p>}
        {error && <p className="text-red-500">{error}</p>}
        {template && (
          <>
            <div className="border-t pt-4">
              <h2 className="font-semibold mb-2 text-lg">Template Info</h2>
              <p>
                <strong>Name:</strong> {template.name ?? "—"}
              </p>
              <p>
                <strong>Category:</strong> {template.category ?? "—"}
              </p>
              <p>
                <strong>Description:</strong> {template.description ?? "—"}
              </p>
            </div>
            <div className="border-t pt-4 space-y-4">
              <h2 className="font-semibold mb-2 text-lg">Live Preview</h2>
              {themes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {themes.map((theme) => (
                    <button
                      key={theme.name}
                      type="button"
                      onClick={() => {
                        setActiveTheme(theme.name);
                      }}
                      className={`rounded-md border px-3 py-1 text-sm font-medium transition-colors ${
                        activeTheme?.name === theme.name
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {theme.name}
                    </button>
                  ))}
                </div>
              )}
              <iframe
                key={previewSrc ?? "template-preview"}
                title="Template Preview"
                sandbox="allow-same-origin"
                src={previewSrc ?? undefined}
                ref={iframeRef}
                style={{ width: "100%", height: "700px", border: "1px solid #ccc", borderRadius: "8px" }}
              />
              {template.stageId && (
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {cancelling ? "Cancelling..." : "Cancel"}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
