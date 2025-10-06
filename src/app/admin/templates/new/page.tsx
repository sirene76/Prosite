"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadButton } from "@uploadthing/react";

import { useUploadThing } from "@/lib/uploadthing";

export default function NewTemplatePage() {
  const router = useRouter();
  const { isUploading } = useUploadThing("templateMedia");
  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    previewImage: "",
    previewVideo: "",
    previewImages: [] as string[],
    features: "",
  });

  async function handleSubmit(e: React.FormEvent) {
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
      <h2 className="text-2xl font-semibold mb-2">Add New Template</h2>

      <input
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="w-full bg-gray-900 border border-gray-700 p-2 rounded-md"
      />

      <input
        placeholder="Category"
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
        className="w-full bg-gray-900 border border-gray-700 p-2 rounded-md"
      />

      <textarea
        placeholder="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="w-full bg-gray-900 border border-gray-700 p-2 rounded-md"
      />

      {/* Upload Preview Image */}
      <div>
        <p className="text-sm text-slate-400 mb-1">Preview Image</p>
        <UploadButton
          endpoint="templateMedia"
          onClientUploadComplete={(res) => {
            setForm({ ...form, previewImage: res?.[0]?.url || "" });
          }}
          onUploadError={(err) => alert(err.message)}
        />
        {form.previewImage && <img src={form.previewImage} alt="Preview" className="mt-2 w-64 rounded-md" />}
      </div>

      {/* Upload Preview Video */}
      <div>
        <p className="text-sm text-slate-400 mb-1">Preview Video (optional)</p>
        <UploadButton
          endpoint="templateMedia"
          onClientUploadComplete={(res) => {
            setForm({ ...form, previewVideo: res?.[0]?.url || "" });
          }}
          onUploadError={(err) => alert(err.message)}
        />
        {form.previewVideo && (
          <video src={form.previewVideo} controls className="mt-2 w-64 rounded-md" />
        )}
      </div>

      {/* Upload Gallery Images */}
      <div>
        <p className="text-sm text-slate-400 mb-1">Gallery Images</p>
        <UploadButton
          endpoint="templateMedia"
          onClientUploadComplete={(res) => {
            const urls = res?.map((f) => f.url) || [];
            setForm({ ...form, previewImages: [...form.previewImages, ...urls] });
          }}
          onUploadError={(err) => alert(err.message)}
        />
        <div className="mt-2 grid grid-cols-3 gap-2">
          {form.previewImages.map((img, i) => (
            <img key={i} src={img} alt={`Preview ${i}`} className="rounded-md" />
          ))}
        </div>
      </div>

      <input
        placeholder="Features (comma-separated)"
        value={form.features}
        onChange={(e) => setForm({ ...form, features: e.target.value })}
        className="w-full bg-gray-900 border border-gray-700 p-2 rounded-md"
      />

      {isUploading && <p className="text-sm text-blue-400">Uploading media...</p>}

      <button
        type="submit"
        className="mt-4 bg-blue-600 px-4 py-2 rounded-md text-white hover:bg-blue-500"
      >
        Save Template
      </button>
    </form>
  );
}
