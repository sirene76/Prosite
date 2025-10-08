"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import ImageDropInput from "@/components/ui/ImageDropInput";

type TemplateInput = {
  _id?: string;
  name?: string;
  slug?: string;
  category?: string;
  description?: string;
  previewImage?: string;
  html?: string;
  css?: string;
  meta?: string | Record<string, unknown>;
};

type TemplateFormProps = {
  template?: TemplateInput;
  mode: "create" | "edit";
};

function formatMeta(meta: TemplateInput["meta"]): string {
  if (!meta) return "";
  if (typeof meta === "string") return meta;
  try {
    return JSON.stringify(meta, null, 2);
  } catch (error) {
    console.warn("Failed to stringify template meta", error);
    return "";
  }
}

const defaultValues = {
  name: "",
  slug: "",
  category: "",
  description: "",
  previewImage: "",
  html: "",
  css: "",
  meta: "",
};

export function TemplateForm({ template, mode }: TemplateFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(() => ({
    name: template?.name ?? defaultValues.name,
    slug: template?.slug ?? defaultValues.slug,
    category: template?.category ?? defaultValues.category,
    description: template?.description ?? defaultValues.description,
    previewImage: template?.previewImage ?? defaultValues.previewImage,
    html: template?.html ?? defaultValues.html,
    css: template?.css ?? defaultValues.css,
    meta: formatMeta(template?.meta) || defaultValues.meta,
  }));
  const [renderedPreview, setRenderedPreview] = useState("");

  const previewDocument = useMemo(
    () => `
      <html>
        <head>
          <style>${formData.css}</style>
        </head>
        <body style="margin:0;padding:0">${formData.html}</body>
      </html>
    `,
    [formData.html, formData.css]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      setRenderedPreview(previewDocument);
    }, 400);

    return () => clearTimeout(timeout);
  }, [previewDocument]);

  // Handle text input / textarea change
  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      slug:
        formData.slug.trim() ||
        formData.name.trim().toLowerCase().replace(/\s+/g, "-"),
      category: formData.category.trim() || undefined,
      description: formData.description,
      previewImage: formData.previewImage.trim() || undefined,
      html: formData.html,
      css: formData.css,
      meta: formData.meta,
    };

    const url =
      mode === "create"
        ? "/api/admin/templates"
        : `/api/admin/templates/${template?._id}`;
    const method = mode === "create" ? "POST" : "PUT";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      router.push("/admin/templates");
      router.refresh();
    } catch (cause) {
      console.error("❌ Failed to submit template form:", cause);
      setError("Failed to save template. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClassName =
    "w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-6 py-10">
      <div className="space-y-4">
        {/* Name + Slug */}
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

        {/* Category + Preview Image */}
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

          <div className="space-y-2">
            <ImageDropInput
              label="Upload Preview Image"
              value={formData.previewImage}
              onChange={(url) =>
                setFormData((prev) => ({
                  ...prev,
                  previewImage: url,
                }))
              }
              onClear={() =>
                setFormData((prev) => ({
                  ...prev,
                  previewImage: "",
                }))
              }
            />
          </div>
        </div>

        {/* Description */}
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

        {/* 🧩 HTML Section */}
        <div>
          <label className="block text-sm font-medium text-slate-300" htmlFor="html">
            Template HTML
          </label>
          <textarea
            id="html"
            name="html"
            placeholder="<section>...</section>"
            className={`${inputClassName} h-52 font-mono text-sm`}
            value={formData.html}
            onChange={handleChange}
            required
          />
        </div>

        {/* 🎨 CSS Section */}
        <div>
          <label className="block text-sm font-medium text-slate-300" htmlFor="css">
            Template CSS
          </label>
          <textarea
            id="css"
            name="css"
            placeholder="body { font-family: sans-serif; }"
            className={`${inputClassName} h-40 font-mono text-sm`}
            value={formData.css}
            onChange={handleChange}
          />
        </div>

        {/* ⚙️ Meta JSON Section */}
        <div>
          <label className="block text-sm font-medium text-slate-300" htmlFor="meta">
            Meta JSON
          </label>
          <textarea
            id="meta"
            name="meta"
            placeholder='{ "theme": "light", "primaryColor": "#2563eb" }'
            className={`${inputClassName} h-36 font-mono text-sm`}
            value={formData.meta}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* 🔍 Live Preview */}
      <div className="mt-10">
        <h3 className="text-lg font-semibold text-white mb-2">
          Live Template Preview
        </h3>
        <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800">
          <iframe
            title="Template Preview"
            srcDoc={renderedPreview}
            className="w-full h-[600px] border-none bg-white"
            sandbox="allow-same-origin allow-scripts"
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">
          This is a sandboxed preview. CSS and HTML render in isolation as you
          type.
        </p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting
          ? "Saving..."
          : mode === "create"
          ? "Create Template"
          : "Save Changes"}
      </button>
    </form>
  );
}
