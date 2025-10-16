import type { ReactNode } from "react";

import { BuilderProvider } from "@/context/BuilderContext";
import {
  getTemplateAssets,
  getTemplates,
  resolveActiveTemplateVersion,
  type TemplateDefinition,
  type TemplateMeta,
  type TemplateSectionDefinition,
  type TemplateColorDefinition,
  type TemplateModuleDefinition,
} from "@/lib/templates";
import { ensureTemplateFieldIds, normaliseTemplateFields } from "@/lib/templateFieldUtils";

import { BuilderLayoutClient } from "./BuilderLayoutClient";

type BuilderRootProps = {
  children: ReactNode;
};

export default async function BuilderRoot({ children }: BuilderRootProps) {
  const templates = await getTemplates();
  const enrichedTemplates: TemplateDefinition[] = await Promise.all(
    templates.map(async (template) => {
      const assets = await getTemplateAssets(template.id);
      if (assets?.template) {
        return assets.template;
      }
      const html = typeof template.html === "string" ? template.html : "";
      const css = typeof template.css === "string" ? template.css : "";
      let meta: TemplateMeta = {};
      if (template.meta) {
        if (typeof template.meta === "string") {
          try {
            const parsed = JSON.parse(template.meta) as TemplateMeta;
            if (parsed && typeof parsed === "object") {
              meta = parsed;
            }
          } catch (error) {
            console.error("⚠️ Failed to parse inline template meta", error);
          }
        } else if (typeof template.meta === "object") {
          meta = template.meta as TemplateMeta;
        }
      }
      const activeVersion = resolveActiveTemplateVersion(template, html, css, meta);
      const sections = Array.isArray(meta.sections)
        ? (meta.sections as TemplateSectionDefinition[])
        : [];
      const colors = Array.isArray(meta.colors)
        ? (meta.colors as TemplateColorDefinition[])
        : [];
      const fonts = Array.isArray(meta.fonts) ? (meta.fonts as string[]) : [];
      const modules = Array.isArray(meta.modules)
        ? (meta.modules as TemplateModuleDefinition[])
        : [];
      const fieldSource = ensureTemplateFieldIds(meta.fields);
      meta.fields = fieldSource;
      const fields = normaliseTemplateFields(fieldSource);
      return {
        ...template,
        sections,
        colors,
        fonts,
        modules,
        fields,
        meta,
        builder: meta.builder,
        html,
        css,
        js,
        htmlUrl: template.htmlUrl ?? activeVersion.htmlUrl ?? undefined,
        cssUrl: template.cssUrl ?? activeVersion.cssUrl ?? undefined,
        jsUrl: template.jsUrl ?? activeVersion.jsUrl ?? undefined,
        metaUrl: template.metaUrl ?? activeVersion.metaUrl ?? undefined,
        previewUrl: template.previewUrl ?? activeVersion.previewUrl ?? undefined,
        previewVideo: template.previewVideo ?? activeVersion.previewVideo ?? undefined,
        activeVersion,
      } satisfies TemplateDefinition;
    })
  );

  return (
    <BuilderProvider templates={enrichedTemplates}>
      <BuilderLayoutClient>{children}</BuilderLayoutClient>
    </BuilderProvider>
  );
}
