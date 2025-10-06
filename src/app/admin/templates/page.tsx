import Link from "next/link";
import { revalidatePath } from "next/cache";

import { connectDB } from "@/lib/mongodb";
import { Template } from "@/models/template";

const fallbackBaseUrl = "http://localhost:3000";

function getBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL;
  if (!fromEnv) {
    return fallbackBaseUrl;
  }

  return fromEnv.startsWith("http") ? fromEnv : `https://${fromEnv}`;
}

type TemplateListItem = {
  _id: string;
  name: string;
  slug: string;
  category?: string;
  description?: string;
  previewImage?: string;
  features?: string[];
  isActive: boolean;
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
            templates.map((template) => (
              <article key={template._id} className="flex flex-col justify-between rounded-xl border border-slate-900 bg-gray-900/60 p-5 shadow-lg shadow-black/10">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                      {template.category ? (
                        <p className="text-xs uppercase tracking-wide text-slate-400">{template.category}</p>
                      ) : null}
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        template.isActive
                          ? "bg-emerald-500/10 text-emerald-300"
                          : "bg-slate-700/40 text-slate-300"
                      }`}
                    >
                      {template.isActive ? "Published" : "Unpublished"}
                    </span>
                  </div>
                  {template.description ? (
                    <p className="text-sm text-slate-400">{template.description}</p>
                  ) : null}
                  {template.features && template.features.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {template.features.map((feature) => (
                        <span
                          key={feature}
                          className="rounded-full bg-slate-800/60 px-2 py-1 text-xs text-slate-300"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="mt-6 flex items-center justify-between text-sm">
                  <Link href={`/admin/templates/${template._id}/edit`} className="font-medium text-blue-400 transition hover:text-blue-300">
                    Edit
                  </Link>
                  <form action={deleteTemplate}>
                    <input type="hidden" name="templateId" value={template._id} />
                    <button
                      type="submit"
                      className="font-medium text-red-400 transition hover:text-red-300"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
}
