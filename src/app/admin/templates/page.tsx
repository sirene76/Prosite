/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { revalidatePath } from "next/cache";

import { connectDB } from "@/lib/mongodb";
import { Template } from "@/models/template";

import { TemplateAdminActions } from "./_components/TemplateAdminActions";

const fallbackBaseUrl = "http://localhost:3000";

function getBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL;
  if (!fromEnv) {
    return fallbackBaseUrl;
  }

  return fromEnv.startsWith("http") ? fromEnv : `https://${fromEnv}`;
}

type TemplateVersionSummary = {
  number: string;
  previewUrl?: string;
  previewVideo?: string;
  htmlUrl?: string;
  cssUrl?: string;
  metaUrl?: string;
  createdAt?: string;
  changelog?: string;
};

type TemplateListItem = {
  _id: string;
  name: string;
  slug: string;
  category?: string;
  subcategory?: string;
  description?: string;
  tags?: string[];
  thumbnail?: string;
  previewVideo?: string;
  currentVersion?: string;
  versions?: TemplateVersionSummary[];
  published: boolean;
  featured: boolean;
  createdAt: string;
};

async function fetchTemplates(): Promise<TemplateListItem[]> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/admin/templates`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Failed to load templates");
  }

  return (await response.json()) as TemplateListItem[];
}

async function deleteTemplate(formData: FormData) {
  "use server";

  const id = formData.get("templateId");
  if (!id) {
    return;
  }

  await connectDB();
  await Template.findByIdAndDelete(id.toString());
  revalidatePath("/admin/templates");
}

export default async function AdminTemplatesPage() {
  let templates: TemplateListItem[] = [];
  let fetchError: string | null = null;

  try {
    templates = await fetchTemplates();
  } catch (error) {
    console.error("Failed to fetch admin templates", error);
    fetchError = "Unable to load templates. Please try again.";
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Templates</h2>
          <p className="text-sm text-slate-400">
            Create, edit, and publish templates available to builders.
          </p>
        </div>
        <Link
          href="/admin/templates/new"
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          + Add Template
        </Link>
      </div>

      {fetchError ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {fetchError}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-10 text-center text-sm text-slate-400">
              No templates found yet. Create your first template to get started.
            </div>
          ) : (
            templates.map((template) => {
              const currentVersion = template.versions?.find(
                (version) => version.number === template.currentVersion
              );
              const tags = Array.isArray(template.tags) ? template.tags : [];

              return (
                <article
                  key={template._id}
                  className="flex flex-col justify-between rounded-lg border border-slate-700 bg-slate-900 p-4 shadow-lg shadow-black/10"
                >
                  <Link
                    href={`/templates/${template._id}`}
                    className="group block rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                    aria-label={`View ${template.name} template preview`}
                  >
                    <div className="relative mb-4 h-48 w-full overflow-hidden rounded-md bg-slate-800">
                      {template.previewVideo ? (
                        <video
                          key={template.previewVideo}
                          src={template.previewVideo}
                          muted
                          autoPlay
                          loop
                          playsInline
                          poster={template.thumbnail}
                          className="h-full w-full object-cover"
                        />
                      ) : template.thumbnail ? (
                        <img
                          src={template.thumbnail}
                          alt={template.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-slate-500">
                          No Preview
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-slate-100 transition-colors group-hover:text-blue-400">
                        {template.name}
                      </h3>
                      <p className="text-xs uppercase tracking-wide text-slate-500">/{template.slug}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                        {template.category ? <span>{template.category}</span> : null}
                        {template.subcategory ? <span>• {template.subcategory}</span> : null}
                        <span>
                          Version: {template.currentVersion ?? currentVersion?.number ?? "—"}
                        </span>
                      </div>
                      {template.description ? (
                        <p className="text-sm text-slate-400">{template.description}</p>
                      ) : null}
                      <div className="flex flex-wrap gap-2 pt-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            template.published
                              ? "bg-emerald-500/10 text-emerald-300"
                              : "bg-slate-700/50 text-slate-300"
                          }`}
                        >
                          {template.published ? "Published" : "Unpublished"}
                        </span>
                        {template.featured ? (
                          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-300">
                            Featured
                          </span>
                        ) : null}
                      </div>
                      {tags.length ? (
                        <div className="mt-2 flex flex-wrap gap-1 text-xs text-slate-500">
                          {tags.map((tag) => (
                            <span key={tag} className="rounded bg-slate-800 px-2 py-0.5">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </Link>

                  <div className="mt-6 flex items-center justify-between text-sm">
                    <Link
                      href={`/admin/templates/${template._id}/edit`}
                      className="font-medium text-blue-400 transition hover:text-blue-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                    >
                      Edit
                    </Link>
                    <TemplateAdminActions
                      id={template._id}
                      published={template.published}
                      featured={template.featured}
                    />
                  </div>
                  <form action={deleteTemplate} className="mt-4 text-right">
                    <input type="hidden" name="templateId" value={template._id} />
                    <button
                      type="submit"
                      className="text-sm font-medium text-red-400 transition hover:text-red-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                    >
                      Delete
                    </button>
                  </form>
                </article>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
