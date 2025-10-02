"use client";

import { useMemo } from "react";

import { useBuilder } from "@/context/BuilderContext";

export function useBuilderStore() {
  const { content, selectedTemplate } = useBuilder();

  const websiteName = useMemo(() => {
    const nameCandidates = [
      content.siteName,
      content.websiteName,
      content.businessName,
      content.name,
      selectedTemplate?.name,
    ];

    const resolved = nameCandidates.find((value) => Boolean(value?.trim()));
    return resolved?.trim() ?? "";
  }, [content.businessName, content.name, content.siteName, content.websiteName, selectedTemplate?.name]);

  const theme = useMemo(() => {
    if (typeof content.theme === "string" && content.theme.trim().length > 0) {
      return content.theme.trim();
    }

    return selectedTemplate?.name ?? "Default";
  }, [content.theme, selectedTemplate?.name]);

  return {
    websiteName,
    theme,
  };
}
