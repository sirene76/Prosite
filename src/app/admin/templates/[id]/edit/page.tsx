import { notFound } from "next/navigation";

import { TemplateForm } from "../../_components/TemplateForm";

const fallbackBaseUrl = "http://localhost:3000";

function getBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL;
  if (!fromEnv) {
    return fallbackBaseUrl;
  }

  return fromEnv.startsWith("http") ? fromEnv : `https://${fromEnv}`;
}

type TemplateResponse = {
  _id: string;
  name: string;
  slug: string;
  category?: string;
  description?: string;
  previewImage?: string;
  html?: string;
  css?: string;
  meta?: Record<string, unknown>;
};

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

export default async function EditTemplatePage({ params }: { params: { id: string } }) {
  const template = await getTemplate(params.id);

  if (!template) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Edit Template</h2>
        <p className="text-sm text-slate-400">
          Update template details, media, and publishing status.
        </p>
      </div>

      <TemplateForm mode="edit" template={template} />
    </div>
  );
}
