"use client";

import "@/styles/new-builder.css";
import React, { useEffect, useMemo, useState } from "react";

import InspectorPanel from "@/components/InspectorPanel";
import NewBuilderPreview from "@/components/NewBuilderPreview";
import NewBuilderShell, {
  type BuilderShellRenderProps,
  type BuilderStep,
} from "@/components/NewBuilderShell";
import { DEBUG_PREVIEW } from "@/lib/debug";
import { useBuilderStore } from "@/store/builderStore";
import type { Theme, TemplateMeta } from "@/store/builderStore";

// === Debug Overlay ===
export function BuilderDebugBar() {
  const s = useBuilderStore();
  if (!DEBUG_PREVIEW) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 8,
        right: 8,
        zIndex: 999999,
        background: "rgba(0,0,0,.7)",
        color: "#fff",
        font: "12px/1.4 monospace",
        padding: "8px 10px",
        borderRadius: 6,
      }}
    >
      <div>[builder] debug</div>
      <div>template: {s.template?.id || "none"}</div>
      <div>
        fields: {s.template?.fields?.length ?? 0} | modules:{" "}
        {s.template?.modules?.length ?? 0}
      </div>
      <div>theme: {s.theme?.id || "none"}</div>
      <div>
        content keys:{" "}
        {Object.keys(s.content || {}).slice(0, 8).join(", ") || "none"}
      </div>
    </div>
  );
}

// === Local Types ===
type BuilderPageClientProps = {
  websiteId: string;
  builderShell?: BuilderShellRenderProps;
  steps?: BuilderStep[];
  activeStep?: string;
  onStepChange?: (stepId: string) => void;
};

type TemplateResponse = {
  html?: string | null;
  meta?: Record<string, unknown>;
};

type WebsiteResponse = {
  name?: string;
  templateId?: string;
  theme?: unknown;
  content?: unknown;
  branding?: unknown;
};

type TemplateThemeOption = {
  id?: string;
  name?: string;
  label?: string;
  colors?: Record<string, string> | string[];
  fonts?: Record<string, string>;
  font?: string;
  palette?: string[];
};

// === Helpers ===
const getThemeIdentifier = (theme: TemplateThemeOption, fallback: string) =>
  theme.id || theme.name || theme.label || fallback;

// Convert TemplateThemeOption[] -> Theme[]
const toThemeArray = (rawThemes: TemplateThemeOption[] = []): Theme[] =>
  rawThemes.map((t, i) => ({
    id: t.id ?? `theme-${i}`,
    name: t.name ?? t.label ?? `Theme ${i + 1}`,
    colors: (() => {
      if (Array.isArray(t.colors)) {
        return t.colors.reduce<Record<string, string>>((acc, color, idx) => {
          if (typeof color === "string") acc[`--color-${idx + 1}`] = color;
          return acc;
        }, {});
      }
      if (t.colors && typeof t.colors === "object") {
        return t.colors as Record<string, string>;
      }
      if (Array.isArray(t.palette)) {
        return t.palette.reduce<Record<string, string>>((acc, color, idx) => {
          if (typeof color === "string") acc[`--color-${idx + 1}`] = color;
          return acc;
        }, {});
      }
      return {};
    })(),
  }));

const extractTemplateThemes = (meta?: Record<string, unknown>): TemplateThemeOption[] => {
  if (!meta || typeof meta !== "object") return [];
  const rawThemes = (meta as any).themes;
  return Array.isArray(rawThemes) ? (rawThemes as TemplateThemeOption[]) : [];
};

const toFontRecord = (theme: TemplateThemeOption | null): Record<string, string> => {
  if (!theme) return {};
  if (theme.font && typeof theme.font === "string") return { primary: theme.font };
  if (theme.fonts && typeof theme.fonts === "object") {
    const entries = Object.entries(theme.fonts).filter(
      ([, val]) => typeof val === "string",
    ) as [string, string][];
    const fonts = Object.fromEntries(entries);
    if (!fonts.primary && entries.length > 0) fonts.primary = entries[0][1];
    return fonts;
  }
  return {};
};

// === Main Component ===
export default function BuilderPageClient({
  websiteId,
  builderShell,
  steps,
  activeStep,
  onStepChange,
}: BuilderPageClientProps) {
  const [templateHtml, setTemplateHtml] = useState("");
  const [websiteName, setWebsiteName] = useState("");

  const { initialize, setTemplate, setTheme, setContent, template, theme, content } =
    useBuilderStore();

  // === Fetch website + template ===
  useEffect(() => {
    let cancelled = false;
    async function loadWebsite() {
      if (!websiteId || websiteId === "new") return;

      try {
        const websiteRes = await fetch(`/api/websites/${websiteId}`);
        if (!websiteRes.ok) throw new Error("Website fetch failed");
        const website = (await websiteRes.json()) as WebsiteResponse;
        if (cancelled) return;

        setWebsiteName(website.name ?? "");

        if (!website.templateId) {
          console.error("❌ Missing templateId in website");
          return;
        }

        const templateRes = await fetch(`/api/templates/${website.templateId}`);
        if (!templateRes.ok) throw new Error("Template fetch failed");
        const templateData = (await templateRes.json()) as TemplateResponse;
        if (cancelled) return;

        // Apply template
        const meta = templateData.meta ?? {};
        const rawThemes = extractTemplateThemes(meta);
        const convertedThemes = toThemeArray(rawThemes);

// === Apply data to store ===
if (cancelled) return;

// Build default nested content from meta.fields
function buildDefaultContent(fields: { id: string; default?: string }[] = []) {
  const content: Record<string, any> = {};
  for (const field of fields) {
    const parts = field.id.split(".");
    let current = content;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        current[part] = field.default ?? "";
      } else {
        current[part] = current[part] || {};
        current = current[part];
      }
    }
  }
  return content;
}

const defaultNested = buildDefaultContent((meta as any).fields ?? []);
const mergedContent = { ...defaultNested, ...(website.content || {}) };

// Update store
setTemplate({
  id: website.templateId,
  name: (meta as any).name ?? "Untitled Template",
  description: (meta as any).description ?? "",
  category: (meta as any).category ?? "",
  modules: (meta as any).modules ?? [],
  fields: (meta as any).fields ?? [],
  themes: convertedThemes,
} as TemplateMeta);

setTemplateHtml(templateData.html ?? "");

if (website.theme && typeof website.theme === "object") {
  setTheme(website.theme as Theme);
} else if (convertedThemes.length > 0) {
  setTheme(convertedThemes[0]);
}

// ✅ Set nested merged content
setContent("", mergedContent);

// ✅ Initialize AFTER everything is ready, including templateId
initialize({
  websiteId,
  templateId: website.templateId,
  content: mergedContent,
  theme: website.theme ?? convertedThemes[0],
});


        // Theme
        if (website.theme && typeof website.theme === "object") {
          setTheme(website.theme as Theme);
        } else if (convertedThemes.length > 0) {
          setTheme(convertedThemes[0]);
        }

        // Content
        if (website.content && typeof website.content === "object") {
          setContent("", website.content);
        }

        initialize({ websiteId });
      } catch (err) {
        console.error("Builder initialization failed:", err);
      }
    }
    loadWebsite();
    return () => {
      cancelled = true;
    };
  }, [websiteId, initialize, setTemplate, setTheme, setContent]);

  // === Step Management ===
  const [internalActiveStep, setInternalActiveStep] = useState(activeStep ?? "template");
  const resolvedSteps: BuilderStep[] = useMemo(
    () =>
      steps ?? [
        { id: "template", label: "Template" },
        { id: "branding", label: "Branding" },
        { id: "checkout", label: "Checkout" },
      ],
    [steps],
  );

  useEffect(() => {
    if (activeStep) setInternalActiveStep(activeStep);
  }, [activeStep]);

  const resolvedActiveStep = activeStep ?? internalActiveStep;
  const handleStepChange = onStepChange ?? setInternalActiveStep;

  // === Preview data ===
  const previewTheme = useMemo(
    () => ({
      colors: theme?.colors ?? {},
      fonts: toFontRecord(theme as any),
    }),
    [theme],
  );

  const previewData = useMemo(
    () => ({
      title: content?.title || websiteName,
      business: content?.businessName || websiteName,
      logo: content?.logoUrl,
      theme: previewTheme,
    }),
    [content, previewTheme, websiteName],
  );

  // === Renderer ===
  const renderBuilderContent = (props: BuilderShellRenderProps): React.ReactElement => (
    <>
      <BuilderDebugBar />
      <div className="builder-grid">
        <section className="preview-panel">
          <NewBuilderPreview
            templateHtml={templateHtml}
            data={previewData}
            device={props.device}
            zoom={props.zoom}
          />
        </section>
        <InspectorPanel />
      </div>
    </>
  );

  // === Shell ===
  if (builderShell) return renderBuilderContent(builderShell);

 return (
  <NewBuilderShell
    steps={resolvedSteps}
    activeStep={resolvedActiveStep}
    onStepChange={handleStepChange}
    websiteId={websiteId}
  >
    {renderBuilderContent as unknown as React.ReactNode}
  </NewBuilderShell>
);

}
