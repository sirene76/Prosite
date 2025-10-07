"use client";

import { useMemo } from "react";

import { useBuilder } from "@/context/BuilderContext";
import type { BuilderPanel } from "@/lib/templates";

import { ImageGridPanel } from "./ImageGridPanel";
import { TableEditorPanel } from "./TableEditorPanel";
import { TextListPanel } from "./TextListPanel";

export function DynamicPanelsTabs() {
  const { selectedTemplate } = useBuilder();
  const panels = useMemo(() => {
    const customPanels = (selectedTemplate as unknown as { meta?: { builder?: { customPanels?: BuilderPanel[] } } })?.meta?.builder
      ?.customPanels;
    if (!Array.isArray(customPanels)) {
      return [] as BuilderPanel[];
    }
    return customPanels;
  }, [selectedTemplate]);

  if (!panels.length) {
    return null;
  }

  // This component currently acts as a discovery helper; actual tab rendering happens in Sidebar.
  return null;
}

export function DynamicPanelRenderer({ panel }: { panel: BuilderPanel }) {
  switch (panel.type) {
    case "image-grid":
      return <ImageGridPanel panel={panel} />;
    case "table-editor":
      return <TableEditorPanel panel={panel} />;
    case "text-list":
      return <TextListPanel panel={panel} />;
    default:
      return <p className="text-slate-400">Unsupported panel type: {panel.type}</p>;
  }
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">{title}</h3>
      {children}
    </div>
  );
}
