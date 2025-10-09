"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputClassName =
  "w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30";

type TemplateInput = {
  _id?: string;
  name?: string;
  slug?: string;
  category?: string;
  description?: string;
  previewUrl?: string;
  htmlUrl?: string;
  cssUrl?: string;
  metaUrl?: string;
};

type TemplateFormProps = {
  template?: TemplateInput;
  mode: "create" | "edit";
};

export function TemplateForm({ template, mode }: TemplateFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(() => ({
    name: template?.name ?? "",
    slug: template?.slug ?? "",
    category: template?.category ?? "",
    description: template?.description ?? "",
    previewUrl: template?.previewUrl ?? "",
    htmlUrl: template?.htmlUrl ?? "",
    cssUrl: template?.cssUrl ?? "",
    metaUrl: template?.metaUrl ?? "",
  }));

  function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim() || formData.name.trim().toLowerCase().replace(/\s+/g, "-"),
      category: formData.category.trim() || undefined,
      description: formData.description.trim() || undefined,
      previewUrl: formData.previewUrl.trim() || undefined,
      htmlUrl: formData.htmlUrl.trim() || undefined,
      cssUrl: formData.cssUrl.trim() || undefined,
      metaUrl: formData.metaUrl.trim() || undefined,
    };

    const url = mode === "create" ? "/api/admin/templates" : `/api/admin/templates/${template?._id}`;
    const method = mode === "create" ? "POST" : "PUT";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Failed to save template");
      }

      router.push("/admin/templates");
      router.refresh();
    } catch (submitError) {
      console.error("Failed to save template", submitError);
      setError(submitError instanceof Error ? submitError.message : "Failed to save template. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-300" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={inputClassName}
            placeholder="Modern Portfolio"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300" htmlFor="slug">
            Slug
          </label>
          <input
            id="slug"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            className={inputClassName}
            placeholder="modern-portfolio"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-300" htmlFor="category">
            Category
          </label>
          <input
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={inputClassName}
            placeholder="Portfolio"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300" htmlFor="previewUrl">
            Preview URL
          </label>
          <input
            id="previewUrl"
            name="previewUrl"
            value={formData.previewUrl}
            onChange={handleChange}
            className={inputClassName}
            placeholder="https://.../preview.png"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className={`${inputClassName} min-h-[100px]`}
          placeholder="Short description of the template"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-300" htmlFor="htmlUrl">
            HTML URL
          </label>
          <input
            id="htmlUrl"
            name="htmlUrl"
            value={formData.htmlUrl}
            onChange={handleChange}
            className={inputClassName}
            placeholder="https://.../template.html"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300" htmlFor="cssUrl">
            CSS URL
          </label>
          <input
            id="cssUrl"
            name="cssUrl"
            value={formData.cssUrl}
            onChange={handleChange}
            className={inputClassName}
            placeholder="https://.../style.css"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300" htmlFor="metaUrl">
          Meta JSON URL
        </label>
        <input
          id="metaUrl"
          name="metaUrl"
          value={formData.metaUrl}
          onChange={handleChange}
          className={inputClassName}
          placeholder="https://.../meta.json"
        />
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/templates")}
          className="rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-70"
        >
          {isSubmitting ? "Saving..." : "Save Template"}
        </button>
      </div>
    </form>
  );
}
