"use client";

import React, {
  useCallback,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";

import { useBuilderStore } from "@/store/builderStore";
import type { TemplateMeta } from "@/types/template";

type TabId = "pages" | "theme" | "content";

type ThemeOption = {
  id?: string;
  name?: string;
  label?: string;
  colors?: Record<string, string> | string[];
  fonts?: Record<string, string>;
  font?: string;
  palette?: string[];
};

type PageModule = {
  id?: string;
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
] as const;

// === helpers ===
const getThemeIdentifier = (theme: ThemeOption, fallback: string) =>
  theme.id || theme.name || theme.label || fallback;

const getThemeLabel = (theme: ThemeOption) =>
  theme.label || theme.name || theme.id || "Theme";

const resolveThemeColors = (theme: ThemeOption): string[] => {
  if (Array.isArray(theme.colors)) return theme.colors;
  if (theme.colors && typeof theme.colors === "object")
    return Object.values(theme.colors);
  if (Array.isArray(theme.palette)) return theme.palette;
  return [];
};

const resolveThemeFont = (theme: ThemeOption) => {
  if (theme.font) return theme.font;
  if (theme.fonts && typeof theme.fonts === "object") {
    const fontEntry = Object.values(theme.fonts).find(
      (value) => typeof value === "string",
    );
    return fontEntry as string | undefined;
  }
  return undefined;
};

const toThemeOptions = (meta: TemplateMeta | null | undefined): ThemeOption[] => {
  if (!meta || !Array.isArray(meta.themes)) return [];
  return meta.themes as ThemeOption[];
};

const toPageModules = (meta: TemplateMeta | null | undefined): PageModule[] => {
  if (!meta || !Array.isArray(meta.modules)) return [];
  return meta.modules as PageModule[];
};

export default function InspectorPanel() {
  const templateMeta = useBuilderStore(
    (state) => state.template?.meta as TemplateMeta | null | undefined,
  );
  const themeId = useBuilderStore((state) => state.themeId);
  const content = useBuilderStore((state) => state.content);
  const setTheme = useBuilderStore((state) => state.setTheme);
  const setContent = useBuilderStore((state) => state.setContent);

  const BRANDING_TO_VALUES_PATH: Record<
    "title" | "businessName" | "logoUrl",
    string
  > = {
    title: "site.title",
    businessName: "site.businessName",
    logoUrl: "site.logo",
  };

  const handleBrandingChange = useCallback(
    (field: "title" | "businessName" | "logoUrl", value: string) => {
      setContent(field, value);

      const valuesPath = BRANDING_TO_VALUES_PATH[field];
      if (valuesPath) {
        setContent(valuesPath, value);
      }
    },
    [setContent],
  );

  const [activeTab, setActiveTab] = useState<TabId>("pages");
  const [collapsed, setCollapsed] = useState(false);
  const [openField, setOpenField] = useState<string | null>("title");

  const pages = useMemo<PageModule[]>(
    () => toPageModules(templateMeta),
    [templateMeta],
  );

  const themes = useMemo<ThemeOption[]>(
    () => toThemeOptions(templateMeta),
    [templateMeta],
  );

  const handleThemeClick = useCallback(
    (theme: ThemeOption, index: number) => {
      const identifier = getThemeIdentifier(theme, `theme-${index}`);
      if (identifier === themeId) {
        return;
      }

      let colorRecord: Record<string, string> | undefined;
      if (Array.isArray(theme.colors)) {
        colorRecord = theme.colors.reduce<Record<string, string>>((acc, color, colorIndex) => {
          if (typeof color === "string") {
            acc[`--color-${colorIndex + 1}`] = color;
          }
          return acc;
        }, {});
      } else if (theme.colors && typeof theme.colors === "object") {
        const entries = Object.entries(theme.colors).filter(
          (entry): entry is [string, string] => typeof entry[1] === "string",
        );
        if (entries.length > 0) {
          colorRecord = Object.fromEntries(entries);
        }
      } else if (Array.isArray(theme.palette)) {
        colorRecord = theme.palette.reduce<Record<string, string>>((acc, color, colorIndex) => {
          if (typeof color === "string") {
            acc[`--color-${colorIndex + 1}`] = color;
          }
          return acc;
        }, {});
      }

      let fonts: Record<string, string> | undefined;
      if (theme.font && typeof theme.font === "string") {
        fonts = { primary: theme.font };
      } else if (theme.fonts && typeof theme.fonts === "object") {
        const entries = Object.entries(theme.fonts).filter(
          (entry): entry is [string, string] => typeof entry[1] === "string",
        );
        if (entries.length > 0) {
          fonts = Object.fromEntries(entries);
          if (!fonts.primary) {
            fonts.primary = entries[0][1];
          }
        }
      }

      const nextThemeConfig = colorRecord || fonts ? { colors: colorRecord, fonts } : null;

      setTheme(identifier, nextThemeConfig ?? null);
    },
    [setTheme, themeId],
  );

  const handleSectionClick = useCallback((sectionId: string | undefined) => {
    if (!sectionId) return;
    window.postMessage({ scrollTo: sectionId }, window.location.origin);
  }, []);

  const handleLogoUpload = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          handleBrandingChange("logoUrl", reader.result);
        }
      };
      reader.readAsDataURL(file);
      event.target.value = "";
    },
    [handleBrandingChange],
  );

  const renderPagesTab = useCallback(() => {
    if (pages.length === 0) {
      return (
        <p className="placeholder">No pages available for this template.</p>
      );
    }

    return (
      <ul className="pages-list">
        {pages.map((mod, index) => (
          <li key={mod.id || index}>
            <button
              type="button"
              className="section-button"
              onClick={() => handleSectionClick(mod.id)}
            >
              {mod.label || mod.id || `Section ${index + 1}`}
            </button>
          </li>
        ))}
      </ul>
    );
  }, [handleSectionClick, pages]);

  const renderThemeTab = useCallback(() => {
    if (themes.length === 0) {
      return <p className="placeholder">No themes available for this template.</p>;
    }

    return (
      <div className="theme-grid">
        {themes.map((theme, index) => {
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
                {font && <span className="theme-font">{font}</span>}
              </div>
              {colors.length > 0 && (
                <div className="theme-swatches" aria-hidden="true">
                  {colors.slice(0, 5).map((color, colorIndex) => (
                    <span
                      key={`${identifier}-c-${colorIndex}`}
                      className="theme-swatch"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  }, [handleThemeClick, themeId, themes]);

  const renderContentTab = useCallback(() => (
    <>
      <p className="desc">Update your branding content and assets.</p>
      {CONTENT_FIELDS.map((field) => {
        const isOpen = openField === field.id;
        const value =
          field.id === "title"
            ? (typeof content.title === "string" ? content.title : "")
            : field.id === "businessName"
            ? (typeof content.businessName === "string"
                ? content.businessName
                : "")
            : "";

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
                  value={value}
                  onChange={(event) =>
                    handleBrandingChange(field.id, event.target.value)
                  }
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
                  {typeof content.logoUrl === "string" && content.logoUrl.length > 0 && (
                    <div className="logo-preview">
                      <img src={content.logoUrl} alt="Logo preview" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </>
  ), [
    content.logoUrl,
    content.businessName,
    content.title,
    handleBrandingChange,
    handleLogoUpload,
    openField,
  ]);

  const renderTabContent = useMemo(() => {
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
  }, [activeTab, renderContentTab, renderPagesTab, renderThemeTab]);

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
        <div className="tab-content active">{renderTabContent}</div>
        <footer className="footer">Made with 💜 Prosite</footer>
      </div>
    </aside>
  );
}

