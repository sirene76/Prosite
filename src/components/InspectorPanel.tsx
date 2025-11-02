"use client";

import React, { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useBuilderStore } from "@/store/builderStore";

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
];

// helpers
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
    const f = Object.values(theme.fonts).find(
      (v) => typeof v === "string"
    ) as string | undefined;
    return f;
  }
  return undefined;
};

export default function InspectorPanel() {
  const [activeTab, setActiveTab] = useState<TabId>("pages");
  const [collapsed, setCollapsed] = useState(false);
  const [openField, setOpenField] = useState<string | null>("title");

<<<<<<< HEAD
  // ✅ pull state from builderStore
  const { template, theme, content, setTheme, setContent } = useBuilderStore();
=======
  const template = useBuilderStore((state) => state.template);
  const themeId = useBuilderStore((state) => state.themeId);
  const content = useBuilderStore((state) => state.content);
  const setTheme = useBuilderStore((state) => state.setTheme);
  const updateContent = useBuilderStore((state) => state.updateContent);
>>>>>>> 976c0ee06117fe1e560e76089e3b2a601c4579a0

  const pages = useMemo<PageModule[]>(() => {
    if (!template?.modules) return [];
    return template.modules;
  }, [template?.modules]);

  const themes = useMemo<ThemeOption[]>(() => {
    if (!template?.themes) return [];
    return template.themes;
  }, [template?.themes]);

  const [titleDraft, setTitleDraft] = useState(content.title ?? "");
  const [businessDraft, setBusinessDraft] = useState(content.businessName ?? "");

  useEffect(() => {
    setTitleDraft(content.title ?? "");
  }, [content.title]);

  useEffect(() => {
    setBusinessDraft(content.businessName ?? "");
  }, [content.businessName]);

<<<<<<< HEAD
  // ✅ Theme click — now passes theme object instead of string
  const handleThemeClick = (selected: ThemeOption) => {
    const themeObj = template?.themes?.find((t) => t.id === selected.id) || selected;
    setTheme(themeObj as any);
=======
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
>>>>>>> 976c0ee06117fe1e560e76089e3b2a601c4579a0
  };

  const handleSectionClick = (sectionId: string) => {
    if (!sectionId) return;
    window.postMessage({ scrollTo: sectionId }, window.location.origin);
  };

  const commitTitle = () => {
    if (titleDraft !== content.title) {
      setContent("title", titleDraft);
    }
  };

  const commitBusiness = () => {
    if (businessDraft !== content.businessName) {
      setContent("businessName", businessDraft);
    }
  };

  const handleLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setContent("logoUrl", reader.result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  // === Tabs ===
  const renderPagesTab = () => (
    <div className="tab-content active">
      {pages.length === 0 ? (
        <p className="placeholder">No pages available for this template.</p>
      ) : (
        <ul className="pages-list">
          {pages.map((mod, index) => (
            <li key={mod.id || index}>
              <button
                type="button"
                className="section-button"
                onClick={() => handleSectionClick(mod.id || "")}
              >
                {mod.label || mod.id || `Section ${index + 1}`}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const renderThemeTab = () => (
    <div className="tab-content active">
<<<<<<< HEAD
      {themes.length === 0 ? (
        <p className="placeholder">No themes available.</p>
      ) : (
        <div className="theme-grid">
          {themes.map((th, index) => {
            const identifier = getThemeIdentifier(th, `theme-${index}`);
            const colors = resolveThemeColors(th);
            const font = resolveThemeFont(th);
            const isActive = theme?.id === identifier || theme?.name === identifier;
=======
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
>>>>>>> 976c0ee06117fe1e560e76089e3b2a601c4579a0

            return (
              <button
                key={identifier}
                type="button"
                className={`theme-card ${isActive ? "active" : ""}`}
                onClick={() => handleThemeClick(th)}
              >
                <div className="theme-card-header">
                  <span className="theme-name">{getThemeLabel(th)}</span>
                  {font && <span className="theme-font">{font}</span>}
                </div>
                {colors.length > 0 && (
                  <div className="theme-swatches" aria-hidden="true">
                    {colors.slice(0, 5).map((color, ci) => (
                      <span
                        key={`${identifier}-c-${ci}`}
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
      )}
    </div>
  );

  const renderContentTab = () => (
    <div className="tab-content active">
      <p className="desc">Update your branding content and assets.</p>
      {CONTENT_FIELDS.map((field) => {
        const isOpen = openField === field.id;
        const value =
          field.id === "title"
            ? titleDraft
            : field.id === "businessName"
            ? businessDraft
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
                  onChange={(e) =>
                    field.id === "title"
                      ? setTitleDraft(e.target.value)
                      : setBusinessDraft(e.target.value)
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
                  {content.logoUrl && (
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
        onClick={() => setCollapsed((v) => !v)}
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
