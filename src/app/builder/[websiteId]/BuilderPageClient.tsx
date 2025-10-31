"use client";

import "@/styles/new-builder.css";

import { useEffect, useMemo, useState } from "react";

import InspectorPanel from "@/components/InspectorPanel";
import NewBuilderPreview from "@/components/NewBuilderPreview";
import NewBuilderShell, {
  type BuilderShellRenderProps,
  type BuilderStep,
} from "@/components/NewBuilderShell";
import { useBuilderStore } from "@/store/builderStore";

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

type TemplateLike = { meta?: Record<string, unknown> } | null;

const extractTemplateThemes = (template: TemplateLike): TemplateThemeOption[] => {
  const metaRecord = template?.meta ?? null;
  if (!metaRecord || typeof metaRecord !== "object") {
    return [];
  }

  const meta = metaRecord as Record<string, unknown>;
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
  const template = useBuilderStore((state) => state.template);
  const themeName = useBuilderStore((state) => state.theme);
  const content = useBuilderStore((state) => state.content);

  useEffect(() => {
    initialize({ websiteId });
  }, [websiteId, initialize]);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      if (!websiteId || websiteId === "new") {
        console.warn("Builder opened without a valid websiteId.");
        return;
      }

      try {
        const websiteRes = await fetch(`/api/websites/${websiteId}`);
        if (!websiteRes.ok) {
          console.error("❌ Failed to fetch website");
          return;
        }
        const website = (await websiteRes.json()) as WebsiteResponse;

        if (cancelled) return;

        setWebsiteName(typeof website.name === "string" ? website.name : "");

        const templateId = website.templateId;
        if (!templateId) {
          console.error("❌ Website has no templateId");
          return;
        }

        const templateRes = await fetch(`/api/templates/${templateId}`);
        if (!templateRes.ok) {
          console.error("❌ Failed to fetch template");
          return;
        }

        const templateData = (await templateRes.json()) as TemplateResponse;
        if (cancelled) return;

        const templateMeta = templateData.meta ?? {};
        const themes = extractTemplateThemes(templateData);
        const websiteThemeName = extractWebsiteThemeName(website.theme);
        const initialTheme =
          websiteThemeName ?? (themes[0] ? getThemeIdentifier(themes[0], "theme-0") : null);
        const initialContent = deriveInitialContent(website);

        setTemplateHtml(templateData.html ?? "");

        initialize({
          websiteId,
          template: { id: templateId, meta: templateMeta },
          content: initialContent,
          theme: initialTheme,
        });
      } catch (error) {
        console.error("Builder fetch failed:", error);
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [websiteId, initialize]);

  const [internalActiveStep, setInternalActiveStep] = useState(activeStep ?? "template");

  const resolvedSteps = useMemo<BuilderStep[]>(
    () =>
      steps ?? [
        { id: "template", label: "Template" },
        { id: "branding", label: "Branding" },
        { id: "checkout", label: "Checkout" },
      ],
    [steps],
  );

  useEffect(() => {
    if (activeStep) {
      setInternalActiveStep(activeStep);
    }
  }, [activeStep]);

  const resolvedActiveStep = activeStep ?? internalActiveStep;
  const handleStepChange = onStepChange ?? setInternalActiveStep;

  const templateThemes = useMemo(() => extractTemplateThemes(template ?? null), [template]);

  const selectedTheme = useMemo(() => {
    if (!themeName) return null;
    return (
      templateThemes.find((theme, index) => getThemeIdentifier(theme, `theme-${index}`) === themeName) ??
      null
    );
  }, [templateThemes, themeName]);

  const previewTheme = useMemo(
    () => ({
      colors: toColorRecord(selectedTheme),
      fonts: (() => {
        const fonts = toFontRecord(selectedTheme);
        if (selectedTheme && Object.keys(fonts).length === 0) {
          const identifier = getThemeIdentifier(selectedTheme, "theme");
          return { primary: identifier };
        }
        return fonts;
      })(),
    }),
    [selectedTheme],
  );

  const previewData = useMemo(
    () => ({
      title: content.title || websiteName,
      business: content.businessName || websiteName,
      logo: content.logoUrl,
      theme: previewTheme,
    }),
    [content.title, content.businessName, content.logoUrl, previewTheme, websiteName],
  );

  const renderBuilderContent = ({
    device,
    zoom,
  }: BuilderShellRenderProps) => (
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
