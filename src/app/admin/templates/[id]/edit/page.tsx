import { notFound } from "next/navigation";

import { TemplateMediaEditor } from "./TemplateMediaEditor";

const fallbackBaseUrl = "http://localhost:3000";

type TemplateResponse = {
  _id: string;
  name?: string;
  image?: string | null;
  thumbnail?: string | null;
  previewUrl?: string | null;
  previewVideo?: string | null;
};

function getBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL;
  if (!fromEnv) {
    return fallbackBaseUrl;
  }

  return fromEnv.startsWith("http") ? fromEnv : `https://${fromEnv}`;
}

async function getTemplate(id: string): Promise<TemplateResponse | null> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/admin/templates/${id}`, { cache: "no-store" });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to fetch template");
  }

  return (await response.json()) as TemplateResponse;
}

export default async function EditTemplateMediaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const template = await getTemplate(id);

  if (!template) {
    notFound();
  }

  return (
    <div className="p-8">
      <TemplateMediaEditor template={template} />
    </div>
  );
}
