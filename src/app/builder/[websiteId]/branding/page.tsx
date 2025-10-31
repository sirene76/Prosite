import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";

import { renderTemplate } from "@/lib/renderTemplate";
import { connectDB } from "@/lib/mongodb";
import Website from "@/models/Website";
import { getTemplateAssets } from "@/lib/templates";
import type { BrandingValues } from "@/components/builder/BrandingForm";

import { BrandingPageClient } from "./BrandingPageClient";

const DEFAULT_BRAND_COLOR = "#3b82f6";

type BrandingPageProps = {
  params: Promise<{
    websiteId: string;
  }>;
};

function toPlainRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") {
    return {};
  }

  if (value instanceof Map) {
    return Object.fromEntries(value.entries());
  }

  return value as Record<string, unknown>;
}

function firstString(...candidates: unknown[]): string | undefined {
  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }
  return undefined;
}

function resolveTemplateId(raw: unknown): string | undefined {
  if (typeof raw === "string" && raw.trim().length > 0) {
    return raw.trim();
  }

  if (
    raw &&
    typeof raw === "object" &&
    "toString" in raw &&
    typeof (raw as { toString: () => string }).toString === "function"
  ) {
    const value = (raw as { toString: () => string }).toString();
    return value?.trim() ?? undefined;
  }

  return undefined;
}

export default async function BrandingPage({ params }: BrandingPageProps) {
  const { websiteId } = await params;

  if (!websiteId || !isValidObjectId(websiteId)) {
    notFound();
  }

  await connectDB();
  const website = await Website.findById(websiteId).lean();

  if (!website) {
    notFound();
  }

  const templateId = resolveTemplateId(website.templateId);
  const assets = templateId ? await getTemplateAssets(templateId) : null;

  const rawTemplateHtml =
    typeof website.html === "string" && website.html.trim().length > 0
      ? website.html
      : assets?.html ?? assets?.template?.html ?? "";

  if (!rawTemplateHtml) {
    notFound();
  }

  const contentRecord = toPlainRecord(website.content);
  const valuesRecord = toPlainRecord(website.values);
  const themeRecord = toPlainRecord(website.theme);
  const themeColors = toPlainRecord(themeRecord["colors"]);

  const initialValues: BrandingValues = {
    websiteName:
      firstString(
        valuesRecord["websiteName"],
        contentRecord["websiteName"],
        contentRecord["siteName"],
        contentRecord["businessName"],
        website.name,
        assets?.template?.name
      ) ?? "",
    businessName:
      firstString(
        valuesRecord["businessName"],
        contentRecord["businessName"],
        contentRecord["company"],
        contentRecord["name"]
      ) ?? "",
    logo:
      firstString(
        valuesRecord["logo"],
        contentRecord["logo"],
        contentRecord["logoUrl"],
        contentRecord["logoSrc"]
      ) ?? "",
    color:
      firstString(
        valuesRecord["color"],
        themeColors["brand"],
        themeColors["primary"],
        themeColors["accent"]
      ) ?? DEFAULT_BRAND_COLOR,
  };

  const previewValues: Record<string, unknown> = {
    ...initialValues,
  };

  const initialPreviewHtml = renderTemplate({
    html: rawTemplateHtml,
    values: previewValues,
    modules: assets?.template?.modules ?? [],
  });

  return (
    <BrandingPageClient
      websiteId={websiteId}
      templateHtml={rawTemplateHtml}
      initialValues={initialValues}
      initialPreviewHtml={initialPreviewHtml}
    />
  );
}
