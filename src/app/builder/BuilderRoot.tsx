import type { ReactNode } from "react";

import { BuilderProvider } from "@/context/BuilderContext";
import {
  getTemplateAssets,
  getTemplates,
  type TemplateDefinition,
} from "@/lib/templates";

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
      const activeVersion =
        template.versions?.find((version) => version.number === template.currentVersion) ??
        template.versions?.[template.versions.length - 1];
      if (!activeVersion) {
        throw new Error(`Template ${template.id} has no versions available.`);
      }
      return {
        ...template,
        sections: [],
        colors: [],
        fonts: [],
        modules: [],
        meta: {},
        html: "",
        css: "",
        htmlUrl: activeVersion.htmlUrl ?? undefined,
        cssUrl: activeVersion.cssUrl ?? undefined,
        metaUrl: activeVersion.metaUrl ?? undefined,
        previewUrl: activeVersion.previewUrl ?? undefined,
        previewVideo: activeVersion.previewVideo ?? undefined,
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
