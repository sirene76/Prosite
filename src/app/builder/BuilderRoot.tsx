import type { ReactNode } from "react";

import { BuilderProvider } from "@/context/BuilderContext";
import { getTemplates } from "@/lib/templates";

import { BuilderLayoutClient } from "./BuilderLayoutClient";

type BuilderRootProps = {
  children: ReactNode;
};

export default async function BuilderRoot({ children }: BuilderRootProps) {
  const templates = await getTemplates();

  return (
    <BuilderProvider templates={templates}>
      <BuilderLayoutClient>{children}</BuilderLayoutClient>
    </BuilderProvider>
  );
}
