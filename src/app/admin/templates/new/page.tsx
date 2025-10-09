"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { TemplateImageUploader } from "@/components/admin/TemplateImageUploader";
import { useUploadThing } from "@/lib/uploadthing";

export default function NewTemplatePage() {
  const router = useRouter();
  const { isUploading } = useUploadThing("templateAssets");
  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    previewImage: "",
    previewVideo: "",
    previewImages: [] as string[],
    features: "",
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        features: form.features.split(",").map((f) => f.trim()),
      }),
    });
    router.push("/admin/templates");
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <h2 className="mb-2 text-2xl font-semibold">Add New Template</h2>

      <input
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="w-full rounded-md border border-gray-700 bg-gray-900 p-2"
      />

      <input
        placeholder="Category"
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
        className="w-full rounded-md border border-gray-700 bg-gray-900 p-2"
      />

      <textarea
        placeholder="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="w-full rounded-md border border-gray-700 bg-gray-900 p-2"
      />

      {/* ✅ Preview Image Upload */}
      <div>
        <p className="mb-1 text-sm text-slate-400">Preview Image</p>
        <TemplateImageUploader
          label="Upload Template Image"
          onUploadComplete={(urls) => {
            const imageUrl = urls[0] ?? "";
            setForm((prev) => ({ ...prev, previewImage: imageUrl }));
          }}
        />
        {form.previewImage && (
          <img
            src={form.previewImage}
            alt="Preview"
            className="mt-3 w-64 rounded-md border border-slate-700 shadow-md"
          />
        )}
      </div>

      {/* ✅ Preview Video Upload */}
      <div>
        <p className="mb-1 text-sm text-slate-400">Preview Video (optional)</p>
        <TemplateImageUploader
          label="Upload Template Video"
          onUploadComplete={(urls) => {
            const videoUrl = urls[0] ?? "";
            setForm((prev) => ({ ...prev, previewVideo: videoUrl }));
          }}
        />
        {form.previewVideo && (
          <video
            src={form.previewVideo}
            controls
            className="mt-3 w-64 rounded-md border border-slate-700 shadow-md"
          />
        )}
      </div>

      {/* ✅ Gallery Upload */}
      <div>
        <p className="mb-1 text-sm text-slate-400">Gallery Images</p>
        <TemplateImageUploader
          label="Upload Gallery Images"
          onUploadComplete={(urls) => {
            setForm((prev) => ({
              ...prev,
              previewImages: [...prev.previewImages, ...urls],
            }));
          }}
        />

        {form.previewImages.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {form.previewImages.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`Gallery ${i}`}
                className="rounded-md border border-slate-700"
              />
            ))}
          </div>
        )}
      </div>

      {/* ✅ Features */}
      <input
        placeholder="Features (comma-separated)"
        value={form.features}
        onChange={(e) => setForm({ ...form, features: e.target.value })}
        className="w-full rounded-md border border-gray-700 bg-gray-900 p-2"
      />

      {isUploading && <p className="text-sm text-blue-400">Uploading media...</p>}

      <button
        type="submit"
        className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-500"
      >
        Save Template
      </button>
    </form>
  );
}
