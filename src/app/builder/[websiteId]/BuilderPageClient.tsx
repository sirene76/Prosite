"use client";

import "@/styles/new-builder.css";

import React, { useCallback, useEffect, useMemo, useState } from "react";

import InspectorPanel from "@/components/InspectorPanel";
import NewBuilderPreview from "@/components/NewBuilderPreview";
import NewBuilderShell, {
  type BuilderShellRenderProps,
  type BuilderStep,
} from "@/components/NewBuilderShell";
import { DEBUG_PREVIEW } from "@/lib/debug";
import { useBuilderStore } from "@/store/builderStore";

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
      <div>template: {template?.id || "none"}</div>
      <div>theme: {themeId || "none"}</div>
      <div>content keys: {topContentKeys}</div>
    </div>
  );
}

type BuilderPageClientProps = {
  websiteId: string;
  builderShell?: BuilderShellRenderProps;
  steps?: BuilderStep[];
  activeStep?: string;
  onStepChange?: (stepId: string) => void;
};

type TemplateThemeOption = Record<string, unknown> & {
  id?: string;
  name?: string;
  label?: string;
  colors?: Record<string, unknown> | string[];
  fonts?: Record<string, unknown>;
  font?: string;
  palette?: string[];
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

const getThemeIdentifier = (theme: TemplateThemeOption, fallback: string) =>
  (typeof theme.id === "string" && theme.id.length > 0
    ? theme.id
    : typeof theme.name === "string" && theme.name.length > 0
      ? theme.name
      : typeof theme.label === "string" && theme.label.length > 0
        ? theme.label
        : fallback);

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
      }
    }
    return "";
  };

  const title = pickString(titleCandidates);
  const businessName = pickString(businessCandidates);
  const logoUrlCandidate = logoCandidates.find(
    (candidate): candidate is string => typeof candidate === "string" && candidate.length > 0,
  );

  return {
    title,
    businessName,
    logoUrl: logoUrlCandidate,
  };
};

const toColorRecord = (theme: TemplateThemeOption | null): Record<string, string> => {
  if (!theme) {
    return {};
  }

  if (theme.colors && !Array.isArray(theme.colors) && typeof theme.colors === "object") {
    const colorRecord = theme.colors as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(colorRecord).filter(([, value]) => typeof value === "string") as Array<
        [string, string]
      >,
    );
  }

  if (Array.isArray(theme.colors)) {
    return theme.colors.reduce<Record<string, string>>((acc, value, index) => {
      if (typeof value === "string") {
        acc[`--color-${index + 1}`] = value;
      }
      return acc;
    }, {});
  }

  if (Array.isArray(theme.palette)) {
    return theme.palette.reduce<Record<string, string>>((acc, value, index) => {
      if (typeof value === "string") {
        acc[`--color-${index + 1}`] = value;
      }
      return acc;
    }, {});
  }

  return {};
};

const toFontRecord = (theme: TemplateThemeOption | null): Record<string, string> => {
  if (!theme) {
    return {};
  }

  if (theme.font && typeof theme.font === "string") {
    return { primary: theme.font };
  }

  if (theme.fonts && typeof theme.fonts === "object") {
    const rawFonts = theme.fonts as Record<string, unknown>;
    const entries = Object.entries(rawFonts).filter(([, value]) => typeof value === "string") as Array<
      [string, string]
    >;

    if (entries.length === 0) {
      return {};
    }

    const fonts = Object.fromEntries(entries) as Record<string, string>;
    if (!fonts.primary) {
      const [, firstValue] = entries[0];
      fonts.primary = firstValue;
    }

    return fonts;
  }

  return {};
};

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

export default function BuilderPageClient({
  websiteId,
  builderShell,
  steps,
  activeStep,
  onStepChange,
}: BuilderPageClientProps) {
  const [templateHtml, setTemplateHtml] = useState("");
  const [websiteName, setWebsiteName] = useState("");

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

  useEffect(() => {
    if (!websiteId || websiteId === "new") {
      console.warn("Builder opened without a valid websiteId.");
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      try {
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
          return;
        }

        const templateData = (await templateRes.json()) as TemplateResponse;
        if (controller.signal.aborted) return;

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

    return () => {
      controller.abort();
    };
  }, [websiteId, initialize]);

  const [internalActiveStep, setInternalActiveStep] = useState(activeStep ?? DEFAULT_STEP_ID);

  const resolvedSteps = useMemo<BuilderStep[]>(
    () => steps ?? DEFAULT_STEPS,
    [steps],
  );

  useEffect(() => {
    if (activeStep) {
      setInternalActiveStep(activeStep);
    }
  }, [activeStep]);

  const resolvedActiveStep = activeStep ?? internalActiveStep;
  const handleStepChange = onStepChange ?? setInternalActiveStep;

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
  );

  if (builderShell) {
    return renderBuilderContent(builderShell);
  }

  return (
    <NewBuilderShell
      steps={resolvedSteps}
      activeStep={resolvedActiveStep}
      onStepChange={handleStepChange}
      websiteId={websiteId}
    >
      {(shellRenderProps) => renderBuilderContent(shellRenderProps)}
    </NewBuilderShell>
  );
}
