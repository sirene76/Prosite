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
      return {
        ...template,
        sections: [],
        colors: [],
        fonts: [],
        modules: [],
        meta: {},
        html: "",
        css: "",
      } satisfies TemplateDefinition;
    })
  );

  return (
    <BuilderProvider templates={enrichedTemplates}>
      <BuilderLayoutClient>{children}</BuilderLayoutClient>
    </BuilderProvider>
  );
}
