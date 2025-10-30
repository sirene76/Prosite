import { notFound } from "next/navigation";

import { connectDB } from "@/lib/mongodb";
import { renderTemplate } from "@/lib/renderTemplate";
import Website from "@/models/Website";
import { Template } from "@/models/template";
import type { BrandingValues } from "@/components/builder/BrandingForm";

import { BrandingPageClient } from "./BrandingPageClient";

function toBrandingValues(values: unknown): BrandingValues {
  const record =
    values && typeof values === "object" ? (values as Record<string, unknown>) : {};

  const websiteName = typeof record.websiteName === "string" ? record.websiteName : "";
  const businessName = typeof record.businessName === "string" ? record.businessName : "";
  const logo = typeof record.logo === "string" ? record.logo : "";
  const color = typeof record.color === "string" && record.color.trim()
    ? record.color
    : undefined;

  return {
    websiteName,
    businessName,
    logo,
    color,
  };
}

type BrandingPageProps = {
  params: Promise<{
    websiteId: string;
  }>;
};

export default async function BrandingPage({ params }: BrandingPageProps) {
  const { websiteId } = await params;
  if (!websiteId) {
    notFound();
  }

  await connectDB();

  const website = await Website.findById(websiteId).lean();
  if (!website) {
    notFound();
  }

  const templateId = website.templateId;
  if (!templateId) {
    notFound();
  }

  const template = await Template.findById(templateId).lean();
  if (!template) {
    notFound();
  }

  const templateHtml = typeof template.html === "string" ? template.html : "";
  const brandingValues = toBrandingValues(website.values);
  const templateValues: Record<string, unknown> = {
    ...brandingValues,
  };

  if (!templateValues.color) {
    templateValues.color = "#3b82f6";
  }

  const initialPreviewHtml = renderTemplate({ html: templateHtml, values: templateValues });

  return (
    <BrandingPageClient
      websiteId={websiteId}
      templateHtml={templateHtml}
      initialValues={brandingValues}
      initialPreviewHtml={initialPreviewHtml}
    />
  );
}
