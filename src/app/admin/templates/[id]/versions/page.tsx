import { notFound } from "next/navigation";

import type { TemplateVersion } from "@/models/template";

import { PublishDraftButton } from "../../_components/PublishDraftButton";

const fallbackBaseUrl = "http://localhost:3000";

function getBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL;
  if (!fromEnv) {
    return fallbackBaseUrl;
  }

  return fromEnv.startsWith("http") ? fromEnv : `https://${fromEnv}`;
}

type TemplateVersionResponse = TemplateVersion & {
  createdAt?: string;
};

type TemplateResponse = {
  _id: string;
  name: string;
  versions?: TemplateVersionResponse[];
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

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleString();
}

export default async function TemplateVersionsPage({ params }: { params: { id: string } }) {
  const template = await getTemplate(params.id);

  if (!template) {
    notFound();
  }

  const versions = [...(template.versions ?? [])].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Template Versions</h2>
        <p className="text-sm text-slate-400">
          Manage draft and published versions for {template.name}.
        </p>
      </div>

      <div className="space-y-4">
        {versions.length === 0 && (
          <p className="text-sm text-slate-300">No versions available.</p>
        )}

        {versions.map((version) => (
          <div
            key={version.number}
            className="flex flex-col gap-2 rounded-lg border border-slate-700 bg-slate-900/60 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-white">Version {version.number}</h3>
                <p className="text-xs text-slate-400">Created {formatDate(version.createdAt)}</p>
              </div>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-200">
                {version.status ?? "draft"}
              </span>
            </div>

            {version.changelog && (
              <p className="text-sm text-slate-200">{version.changelog}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm">
              {version.status === "draft" && version.previewToken && (
                <a
                  href={`/preview/${template._id}?version=${version.number}&token=${version.previewToken}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 underline"
                >
                  Preview Draft
                </a>
              )}

              {version.status === "draft" && (
                <PublishDraftButton templateId={template._id} version={version.number} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
