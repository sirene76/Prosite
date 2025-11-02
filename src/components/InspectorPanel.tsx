"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";

import { useBuilderStore } from "@/store/builderStore";

type TabId = "pages" | "theme" | "content";

type TemplateMeta = {
  pages?: Array<Record<string, unknown>>;
  themes?: Array<Record<string, unknown>>;
};

type ThemeOption = Record<string, unknown> & {
  name?: string;
  label?: string;
  id?: string;
  colors?: Record<string, string> | string[];
  fonts?: Record<string, string>;
  font?: string;
};

type PageOption = Record<string, unknown> & {
  id?: string;
  name?: string;
  label?: string;
  sections?: Array<Record<string, unknown> | string>;
};

type SectionOption = Record<string, unknown> & {
  id?: string;
  sectionId?: string;
  name?: string;
  label?: string;
};

const TAB_LABELS: Record<TabId, string> = {
  pages: "Pages",
  theme: "Theme",
  content: "Content",
};

const CONTENT_FIELDS = [
  { id: "title", label: "Website Title", type: "text" as const },
  { id: "businessName", label: "Business Name", type: "text" as const },
  { id: "logoUrl", label: "Upload Logo", type: "file" as const },
];

const getThemeIdentifier = (theme: ThemeOption, fallback: string) =>
  (typeof theme.id === "string" && theme.id.length > 0
    ? theme.id
    : typeof theme.name === "string" && theme.name.length > 0
      ? theme.name
      : typeof theme.label === "string" && theme.label.length > 0
        ? theme.label
        : fallback);

const getThemeLabel = (theme: ThemeOption) =>
  typeof theme.label === "string" && theme.label.length > 0
    ? theme.label
    : typeof theme.name === "string" && theme.name.length > 0
      ? theme.name
      : "Theme";

const resolveThemeColors = (theme: ThemeOption): string[] => {
  if (Array.isArray(theme.colors)) {
    return theme.colors.filter((value): value is string => typeof value === "string");
  }

  if (theme.colors && typeof theme.colors === "object") {
    return Object.values(theme.colors).filter(
      (value): value is string => typeof value === "string",
    );
  }

  const palette = theme.palette;
  if (Array.isArray(palette)) {
    return palette.filter((value): value is string => typeof value === "string");
  }

  return [];
};

const resolveThemeFont = (theme: ThemeOption) => {
  if (theme.font && typeof theme.font === "string") {
    return theme.font;
  }

  if (theme.fonts && typeof theme.fonts === "object") {
    const fonts = theme.fonts as Record<string, unknown>;
    const primaryFont = fonts.primary;
    if (typeof primaryFont === "string") {
      return primaryFont;
    }

    const firstFont = Object.values(fonts).find((value) => typeof value === "string");
    if (typeof firstFont === "string") {
      return firstFont;
    }
  }

  return undefined;
};

const resolveSectionId = (section: SectionOption | string) => {
  if (typeof section === "string") {
    return section;
  }

  return (
    (typeof section.id === "string" && section.id.length > 0 && section.id) ||
    (typeof section.sectionId === "string" && section.sectionId.length > 0 && section.sectionId) ||
    (typeof section.name === "string" && section.name.length > 0 && section.name) ||
    undefined
  );
};

const resolveSectionLabel = (section: SectionOption | string) => {
  if (typeof section === "string") {
    return section;
  }

  return (
    (typeof section.label === "string" && section.label.length > 0 && section.label) ||
    (typeof section.name === "string" && section.name.length > 0 && section.name) ||
    (typeof section.id === "string" && section.id.length > 0 && section.id) ||
    "Section"
  );
};

export default function InspectorPanel() {
  const [activeTab, setActiveTab] = useState<TabId>("pages");
  const [collapsed, setCollapsed] = useState(false);
  const [openPages, setOpenPages] = useState<Record<string, boolean>>({});
  const [openField, setOpenField] = useState<string | null>("title");

  const template = useBuilderStore((state) => state.template);
  const themeId = useBuilderStore((state) => state.themeId);
  const content = useBuilderStore((state) => state.content);
  const setTheme = useBuilderStore((state) => state.setTheme);
  const updateContent = useBuilderStore((state) => state.updateContent);

  const templateMeta = useMemo<TemplateMeta>(() => {
    if (!template?.meta || typeof template.meta !== "object") {
      return {};
    }
    return template.meta as TemplateMeta;
  }, [template?.meta]);

  const pages = useMemo(() => {
    if (!Array.isArray(templateMeta.pages)) {
      return [] as PageOption[];
    }
    return templateMeta.pages as PageOption[];
  }, [templateMeta.pages]);

  const themes = useMemo(() => {
    if (!Array.isArray(templateMeta.themes)) {
      return [] as ThemeOption[];
    }
    return templateMeta.themes as ThemeOption[];
  }, [templateMeta.themes]);

  const [titleDraft, setTitleDraft] = useState(content.title ?? "");
  const [businessDraft, setBusinessDraft] = useState(content.businessName ?? "");

  useEffect(() => {
    if (pages.length === 0) {
      setOpenPages({});
      return;
    }

    const firstPage = pages[0];
    const firstKey = getThemeIdentifier(firstPage as ThemeOption, "page-0");
    setOpenPages((current) => {
      if (current[firstKey]) {
        return current;
      }
      return { [firstKey]: true };
    });
  }, [pages]);

  useEffect(() => {
    setTitleDraft(content.title ?? "");
  }, [content.title]);

  useEffect(() => {
    setBusinessDraft(content.businessName ?? "");
  }, [content.businessName]);

  const handleThemeClick = (theme: ThemeOption, index: number) => {
    const identifier = getThemeIdentifier(theme, `theme-${index}`);
    if (identifier === themeId) {
      return;
    }
    const colors = resolveThemeColors(theme);
    const colorRecord =
      colors.length > 0
        ? colors.reduce<Record<string, string>>((acc, color, colorIndex) => {
            acc[`--color-${colorIndex + 1}`] = color;
            return acc;
          }, {})
        : undefined;
    const font = resolveThemeFont(theme);
    const fonts = font ? { primary: font } : undefined;
    const nextThemeConfig = colorRecord || fonts ? { colors: colorRecord, fonts } : null;
    setTheme(identifier, nextThemeConfig);
  };

  const handleSectionClick = (section: SectionOption | string) => {
    const sectionId = resolveSectionId(section);
    if (!sectionId) return;
    window.postMessage({ scrollTo: sectionId }, window.location.origin);
  };

  const commitTitle = () => {
    if (titleDraft !== content.title) {
      updateContent("title", titleDraft);
    }
  };

  const commitBusiness = () => {
    if (businessDraft !== content.businessName) {
      updateContent("businessName", businessDraft);
    }
  };

  const handleLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateContent("logoUrl", reader.result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const renderPagesTab = () => (
    <div className="tab-content active">
      <div className="pages-list" role="list">
        {pages.length === 0 ? (
          <p className="placeholder">No pages available for this template.</p>
        ) : (
          pages.map((page, index) => {
            const pageKey = getThemeIdentifier(page as ThemeOption, `page-${index}`);
            const pageLabel = getThemeLabel(page as ThemeOption);
            const sections = Array.isArray(page.sections) ? page.sections : [];
            const isOpen = openPages[pageKey] ?? index === 0;

            return (
              <div className="collapsible" key={pageKey}>
                <button
                  type="button"
                  className={`collapse-toggle ${isOpen ? "open" : ""}`}
                  onClick={() =>
                    setOpenPages((current) => ({
                      ...current,
                      [pageKey]: !isOpen,
                    }))
                  }
                >
                  {pageLabel}
                </button>
                <div className="collapse-content" style={{ display: isOpen ? "block" : "none" }}>
                  {sections.length === 0 ? (
                    <p className="placeholder">No sections for this page.</p>
                  ) : (
                    <ul className="section-list">
                      {sections.map((section, sectionIndex) => {
                        const sectionId = resolveSectionId(section as SectionOption | string);
                        const sectionLabel = resolveSectionLabel(section as SectionOption | string);
                        const key = sectionId ?? `section-${sectionIndex}`;

                        return (
                          <li key={key}>
                            <button
                              type="button"
                              className="section-button"
                              onClick={() => handleSectionClick(section)}
                            >
                              {sectionLabel}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const renderThemeTab = () => (
    <div className="tab-content active">
      <div className="theme-grid">
        {themes.length === 0 ? (
          <p className="placeholder">No themes available for this template.</p>
        ) : (
          themes.map((theme, index) => {
            const identifier = getThemeIdentifier(theme, `theme-${index}`);
            const label = getThemeLabel(theme);
            const colors = resolveThemeColors(theme);
            const font = resolveThemeFont(theme);
            const isActive = themeId === identifier;

            return (
              <button
                key={identifier}
                type="button"
                className={`theme-card ${isActive ? "active" : ""}`}
                onClick={() => handleThemeClick(theme, index)}
              >
                <div className="theme-card-header">
                  <span className="theme-name">{label}</span>
                  {font ? <span className="theme-font">{font}</span> : null}
                </div>
                {colors.length > 0 ? (
                  <div className="theme-swatches" aria-hidden="true">
                    {colors.slice(0, 5).map((color, colorIndex) => (
                      <span
                        key={`${identifier}-color-${colorIndex}`}
                        className="theme-swatch"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  const renderContentTab = () => (
    <div className="tab-content active">
      <p className="desc">Update your branding content and assets.</p>
      {CONTENT_FIELDS.map((field) => {
        const isOpen = openField === field.id;
        return (
          <div className="collapsible" key={field.id}>
            <button
              type="button"
              className={`collapse-toggle ${isOpen ? "open" : ""}`}
              onClick={() => setOpenField(isOpen ? null : field.id)}
            >
              {field.label}
            </button>
            <div className="collapse-content" style={{ display: isOpen ? "block" : "none" }}>
              {field.type === "text" ? (
                <input
                  className="input-field"
                  type="text"
                  value={field.id === "title" ? titleDraft : businessDraft}
                  onChange={(event) =>
                    field.id === "title"
                      ? setTitleDraft(event.target.value)
                      : setBusinessDraft(event.target.value)
                  }
                  onBlur={field.id === "title" ? commitTitle : commitBusiness}
                  placeholder={field.label}
                />
              ) : (
                <div className="upload-field">
                  <label className="upload-label" htmlFor="builder-logo-upload">
                    Choose file
                  </label>
                  <input
                    id="builder-logo-upload"
                    className="input-file"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />
                  {content.logoUrl ? (
                    <div className="logo-preview">
                      <img src={content.logoUrl} alt="Logo preview" />
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "pages":
        return renderPagesTab();
      case "theme":
        return renderThemeTab();
      case "content":
        return renderContentTab();
      default:
        return null;
    }
  };

  return (
    <aside className={`inspector${collapsed ? " collapsed" : ""}`}>
      <button
        type="button"
        className="collapse-btn"
        onClick={() => setCollapsed((value) => !value)}
        aria-label={collapsed ? "Expand inspector" : "Collapse inspector"}
        aria-expanded={!collapsed}
      >
        {collapsed ? "‹" : "›"}
      </button>
      <div className="inspector-content" aria-hidden={collapsed}>
        <h2>Inspector</h2>
        <div className="tabs" role="tablist">
          {(Object.keys(TAB_LABELS) as TabId[]).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
              role="tab"
              aria-selected={activeTab === tab}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
        {renderTabContent()}
        <footer className="footer">Made with 💜 Prosite</footer>
      </div>
    </aside>
  );
}
