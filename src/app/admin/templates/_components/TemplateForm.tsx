"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TemplateInput = {
  _id?: string;
  name: string;
  category?: string;
  description?: string;
  previewImage?: string;
  previewVideo?: string;
  previewImages?: string[];
  features?: string[];
  path?: string;
  isActive?: boolean;
};

type TemplateFormProps = {
  template?: TemplateInput;
  mode: "create" | "edit";
};

const defaultValues: TemplateInput = {
  name: "",
  category: "",
  description: "",
  previewImage: "",
  previewVideo: "",
  previewImages: [],
  features: [],
  path: "",
  isActive: true,
};

export function TemplateForm({ template, mode }: TemplateFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState(() => ({
    name: template?.name ?? defaultValues.name,
    category: template?.category ?? defaultValues.category,
    description: template?.description ?? defaultValues.description,
    previewImage: template?.previewImage ?? defaultValues.previewImage,
    previewVideo: template?.previewVideo ?? defaultValues.previewVideo,
    previewImages: template?.previewImages?.join(", ") ?? "",
    features: template?.features?.join(", ") ?? "",
    path: template?.path ?? defaultValues.path,
    isActive: template?.isActive ?? defaultValues.isActive,
  }));

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleCheckboxChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: checked }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      name: form.name.trim(),
      category: form.category.trim() || null,
      description: form.description.trim(),
      previewImage: form.previewImage.trim() || null,
      previewVideo: form.previewVideo.trim() || null,
      previewImages: form.previewImages
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      features: form.features
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      path: form.path.trim() || null,
      isActive: form.isActive,
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
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      router.push("/admin/templates");
      router.refresh();
    } catch (cause) {
      console.error("Failed to submit template form", cause);
      setError("Failed to save template. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClassName =
    "w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={handleInputChange}
            className={inputClassName}
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-300" htmlFor="category">
              Category
            </label>
            <input
              id="category"
              name="category"
              value={form.category}
              onChange={handleInputChange}
              className={inputClassName}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300" htmlFor="previewImage">
              Preview Image URL
            </label>
            <input
              id="previewImage"
              name="previewImage"
              value={form.previewImage}
              onChange={handleInputChange}
              className={inputClassName}
              placeholder="https://.../preview.png"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-300" htmlFor="previewVideo">
              Preview Video URL
            </label>
            <input
              id="previewVideo"
              name="previewVideo"
              value={form.previewVideo}
              onChange={handleInputChange}
              className={inputClassName}
              placeholder="https://.../preview.mp4"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300" htmlFor="path">
              Custom Path (optional)
            </label>
            <input
              id="path"
              name="path"
              value={form.path}
              onChange={handleInputChange}
              className={inputClassName}
              placeholder="/templates/custom"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300" htmlFor="previewImages">
            Additional Preview Images (comma separated URLs)
          </label>
          <input
            id="previewImages"
            name="previewImages"
            value={form.previewImages}
            onChange={handleInputChange}
            className={inputClassName}
            placeholder="https://.../1.png, https://.../2.png"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300" htmlFor="features">
            Features (comma separated)
          </label>
          <input
            id="features"
            name="features"
            value={form.features}
            onChange={handleInputChange}
            className={inputClassName}
            placeholder="Responsive, SEO ready, Blog"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleInputChange}
            className={`${inputClassName} min-h-[120px]`}
          />
        </div>

        <label className="flex items-center gap-3 text-sm text-slate-300">
          <input
            type="checkbox"
            name="isActive"
            checked={form.isActive}
            onChange={handleCheckboxChange}
            className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-blue-500"
          />
          Published
        </label>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Saving..." : mode === "create" ? "Create Template" : "Save Changes"}
      </button>
    </form>
  );
}
