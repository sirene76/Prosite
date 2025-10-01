import type { ReactNode } from "react";

import { BuilderProvider } from "@/context/BuilderContext";
import { loadTemplates } from "@/lib/templates";

import { BuilderLayoutClient, type BuilderStep } from "./BuilderLayoutClient";

type BuilderRootProps = {
  children: ReactNode;
};

const steps: BuilderStep[] = [
  { label: "Templates", href: "/builder/templates" },
  { label: "Theme", href: "/builder/theme" },
  { label: "Content", href: "/builder/content" },
  { label: "Checkout", href: "/builder/checkout" },
];

export default function BuilderRoot({ children }: BuilderRootProps) {
  const templates = loadTemplates();

  return (
    <BuilderProvider templates={templates}>
      <BuilderLayoutClient steps={steps}>{children}</BuilderLayoutClient>
    </BuilderProvider>
  );
}
