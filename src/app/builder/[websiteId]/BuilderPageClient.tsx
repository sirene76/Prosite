"use client";

import "@/styles/new-builder.css";
<<<<<<< HEAD
import React, { useEffect, useMemo, useState } from "react";
=======

import React, { useCallback, useEffect, useMemo, useState } from "react";
>>>>>>> 976c0ee06117fe1e560e76089e3b2a601c4579a0

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
  const { template, themeId, content } = useBuilderStore((state) => ({
    template: state.template,
    themeId: state.themeId,
    content: state.content,
  }));

  const topContentKeys = Object.keys(content || {}).slice(0, 8).join(", ") || "none";

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
<<<<<<< HEAD
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
=======
      <div>template: {template?.id || "none"}</div>
      <div>theme: {themeId || "none"}</div>
      <div>content keys: {topContentKeys}</div>
>>>>>>> 976c0ee06117fe1e560e76089e3b2a601c4579a0
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

<<<<<<< HEAD
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
=======
const normalizeRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (value instanceof Map) {
    return Object.fromEntries(value.entries());
  }

  return value as Record<string, unknown>;
};

const extractTemplateThemes = (
  templateMeta: Record<string, unknown> | null | undefined,
): TemplateThemeOption[] => {
  if (!templateMeta || typeof templateMeta !== "object") {
    return [];
  }

  const meta = templateMeta as Record<string, unknown>;
  const rawThemes = meta.themes;
  if (!Array.isArray(rawThemes)) {
    return [];
  }

  return rawThemes as TemplateThemeOption[];
};

const extractWebsiteThemeName = (theme: unknown): string | null => {
  if (typeof theme === "string" && theme.length > 0) {
    return theme;
  }

  const themeRecord = normalizeRecord(theme);
  if (!themeRecord) {
    return null;
  }

  if (typeof themeRecord.name === "string" && themeRecord.name.length > 0) {
    return themeRecord.name;
  }

  if (typeof themeRecord.id === "string" && themeRecord.id.length > 0) {
    return themeRecord.id;
  }

  if (typeof themeRecord.label === "string" && themeRecord.label.length > 0) {
    return themeRecord.label;
  }

  return null;
};

const deriveInitialContent = (website: WebsiteResponse) => {
  const contentRecord = normalizeRecord(website.content);
  const brandingRecord = normalizeRecord(website.branding);

  const titleCandidates = [
    contentRecord?.title,
    brandingRecord?.title,
    brandingRecord?.siteTitle,
    website.name,
  ];

  const businessCandidates = [
    contentRecord?.businessName,
    contentRecord?.business,
    brandingRecord?.businessName,
    brandingRecord?.business,
    website.name,
  ];

  const logoCandidates = [
    contentRecord?.logoUrl,
    contentRecord?.logo,
    brandingRecord?.logoUrl,
    brandingRecord?.logo,
  ];

  const pickString = (candidates: Array<unknown>): string => {
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.length > 0) {
        return candidate;
>>>>>>> 976c0ee06117fe1e560e76089e3b2a601c4579a0
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

<<<<<<< HEAD
// === Main Component ===
=======
const DEFAULT_STEPS: BuilderStep[] = [
  { id: "template", label: "Template" },
  { id: "branding", label: "Branding" },
  { id: "checkout", label: "Checkout" },
];

const DEFAULT_STEP_ID = DEFAULT_STEPS[0].id;

const createPreviewTheme = (theme: TemplateThemeOption | null) => ({
  colors: toColorRecord(theme),
  fonts: (() => {
    const fonts = toFontRecord(theme);
    if (theme && Object.keys(fonts).length === 0) {
      const identifier = getThemeIdentifier(theme, "theme");
      return { primary: identifier };
    }
    return fonts;
  })(),
});

>>>>>>> 976c0ee06117fe1e560e76089e3b2a601c4579a0
export default function BuilderPageClient({
  websiteId,
  builderShell,
  steps,
  activeStep,
  onStepChange,
}: BuilderPageClientProps) {
  const [templateHtml, setTemplateHtml] = useState("");
  const [websiteName, setWebsiteName] = useState("");

<<<<<<< HEAD
  const { initialize, setTemplate, setTheme, setContent, template, theme, content } =
    useBuilderStore();
=======
  const initialize = useBuilderStore((state) => state.initialize);
  const resetBuilder = useBuilderStore((state) => state.reset);
  const template = useBuilderStore((state) => state.template);
  const themeId = useBuilderStore((state) => state.themeId);
  const content = useBuilderStore((state) => state.content);

  useEffect(() => {
    resetBuilder();
    setTemplateHtml("");
    setWebsiteName("");
  }, [websiteId, resetBuilder]);
>>>>>>> 976c0ee06117fe1e560e76089e3b2a601c4579a0

  // === Fetch website + template ===
  useEffect(() => {
<<<<<<< HEAD
    let cancelled = false;
    async function loadWebsite() {
      if (!websiteId || websiteId === "new") return;
=======
    if (!websiteId || websiteId === "new") {
      console.warn("Builder opened without a valid websiteId.");
      return;
    }

    const controller = new AbortController();
>>>>>>> 976c0ee06117fe1e560e76089e3b2a601c4579a0

    const load = async () => {
      try {
<<<<<<< HEAD
        const websiteRes = await fetch(`/api/websites/${websiteId}`);
        if (!websiteRes.ok) throw new Error("Website fetch failed");
        const website = (await websiteRes.json()) as WebsiteResponse;
        if (cancelled) return;

        setWebsiteName(website.name ?? "");

        if (!website.templateId) {
          console.error("❌ Missing templateId in website");
=======
        const websiteRes = await fetch(`/api/websites/${websiteId}`, {
          signal: controller.signal,
        });
        if (!websiteRes.ok) {
          console.error("❌ Failed to fetch website");
          return;
        }

        const website = (await websiteRes.json()) as WebsiteResponse;
        if (controller.signal.aborted) return;

        const websiteLabel = typeof website.name === "string" ? website.name : "";
        setWebsiteName(websiteLabel);

        const templateId =
          typeof website.templateId === "string" && website.templateId.length > 0
            ? website.templateId
            : null;

        if (!templateId) {
          console.error("❌ Website has no templateId");
          return;
        }

        const templateRes = await fetch(`/api/templates/${templateId}`, {
          signal: controller.signal,
        });
        if (!templateRes.ok) {
          console.error("❌ Failed to fetch template");
>>>>>>> 976c0ee06117fe1e560e76089e3b2a601c4579a0
          return;
        }

        const templateRes = await fetch(`/api/templates/${website.templateId}`);
        if (!templateRes.ok) throw new Error("Template fetch failed");
        const templateData = (await templateRes.json()) as TemplateResponse;
        if (controller.signal.aborted) return;

<<<<<<< HEAD
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
=======
        const templateMeta = normalizeRecord(templateData.meta);
        const themes = extractTemplateThemes(templateMeta);
        const websiteThemeName = extractWebsiteThemeName(website.theme);
        const initialThemeId =
          websiteThemeName ?? (themes[0] ? getThemeIdentifier(themes[0], "theme-0") : null);
        const initialThemeOption = initialThemeId
          ? themes.find(
              (theme, index) => getThemeIdentifier(theme, `theme-${index}`) === initialThemeId,
            ) ?? null
          : null;
        const initialContent = deriveInitialContent(website);

        setTemplateHtml(typeof templateData.html === "string" ? templateData.html : "");

        initialize({
          template: { id: templateId, meta: templateMeta ?? undefined },
          content: initialContent,
          themeId: initialThemeId,
          themeConfig: initialThemeOption ? createPreviewTheme(initialThemeOption) : null,
        });
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return;
        console.error("Builder fetch failed:", error);
      }
    };

    load();
>>>>>>> 976c0ee06117fe1e560e76089e3b2a601c4579a0

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
      controller.abort();
    };
  }, [websiteId, initialize, setTemplate, setTheme, setContent]);

<<<<<<< HEAD
  // === Step Management ===
  const [internalActiveStep, setInternalActiveStep] = useState(activeStep ?? "template");
  const resolvedSteps: BuilderStep[] = useMemo(
    () =>
      steps ?? [
        { id: "template", label: "Template" },
        { id: "branding", label: "Branding" },
        { id: "checkout", label: "Checkout" },
      ],
=======
  const [internalActiveStep, setInternalActiveStep] = useState(activeStep ?? DEFAULT_STEP_ID);

  const resolvedSteps = useMemo<BuilderStep[]>(
    () => steps ?? DEFAULT_STEPS,
>>>>>>> 976c0ee06117fe1e560e76089e3b2a601c4579a0
    [steps],
  );

  useEffect(() => {
    if (activeStep) setInternalActiveStep(activeStep);
  }, [activeStep]);

  const resolvedActiveStep = activeStep ?? internalActiveStep;
  const handleStepChange = onStepChange ?? setInternalActiveStep;

<<<<<<< HEAD
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
=======
  const templateThemes = useMemo(
    () => extractTemplateThemes(template?.meta ?? null),
    [template?.meta],
  );

  const selectedTheme = useMemo(() => {
    if (!themeId) return null;
    return (
      templateThemes.find(
        (theme, index) => getThemeIdentifier(theme, `theme-${index}`) === themeId,
      ) ?? null
    );
  }, [templateThemes, themeId]);

  const previewTheme = useMemo(() => createPreviewTheme(selectedTheme), [selectedTheme]);

  const titleValue = typeof content.title === "string" ? content.title : "";
  const businessNameValue =
    typeof content.businessName === "string" ? content.businessName : "";
  const logoValue = typeof content.logoUrl === "string" ? content.logoUrl : undefined;

  const previewData = useMemo(
    () => ({
      title: titleValue || websiteName,
      business: businessNameValue || websiteName,
      logo: logoValue,
      theme: previewTheme,
    }),
    [titleValue, businessNameValue, logoValue, previewTheme, websiteName],
  );

  const renderBuilderContent = useCallback(
    ({ device, zoom }: BuilderShellRenderProps) => (
      <>
        <BuilderDebugBar />
        <div className="builder-grid">
          <section className="preview-panel">
            <NewBuilderPreview
              templateHtml={templateHtml}
              data={previewData}
              device={device}
              zoom={zoom}
            />
          </section>

          <InspectorPanel />
        </div>
      </>
    ),
    [previewData, templateHtml],
>>>>>>> 976c0ee06117fe1e560e76089e3b2a601c4579a0
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
