"use client";
import { useState } from "react";
import { UploadButton } from "@/utils/uploadthing";
import { useRouter } from "next/navigation";

export default function NewTemplatePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    category: "",
    subcategory: "",
    tags: "",
    version: "1.0.0",
    htmlUrl: "",
    cssUrl: "",
    metaUrl: "",
    previewUrl: "",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const tags = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const versionNumber = form.version.trim() || "1.0.0";
    const res = await fetch("/api/admin/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        slug: form.slug,
        description: form.description,
        category: form.category,
        subcategory: form.subcategory,
        tags,
        versions: [
          {
            number: versionNumber,
            htmlUrl: form.htmlUrl,
            cssUrl: form.cssUrl,
            metaUrl: form.metaUrl,
            previewUrl: form.previewUrl,
          },
        ],
        currentVersion: versionNumber,
        published: true,
      }),
    });
    if (res.ok) router.push("/admin/templates");
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-4">Add New Template</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className="input" placeholder="Template Name" onChange={e=>setForm({...form, name:e.target.value})}/>
        <input className="input" placeholder="Slug" onChange={e=>setForm({...form, slug:e.target.value})}/>
        <input className="input" placeholder="Category" onChange={e=>setForm({...form, category:e.target.value})}/>
        <input className="input" placeholder="Subcategory" onChange={e=>setForm({...form, subcategory:e.target.value})}/>
        <input className="input" placeholder="Tags (comma separated)" onChange={e=>setForm({...form, tags:e.target.value})}/>
        <input className="input" placeholder="Version (e.g. 1.0.0)" value={form.version} onChange={e=>setForm({...form, version:e.target.value})}/>
        <textarea className="input" placeholder="Description" onChange={e=>setForm({...form, description:e.target.value})}/>
        <div className="grid grid-cols-2 gap-4">
          <UploadButton endpoint="templateFiles" onClientUploadComplete={res => setForm({...form, htmlUrl: res[0].url})}/>
          <UploadButton endpoint="templateFiles" onClientUploadComplete={res => setForm({...form, cssUrl: res[0].url})}/>
          <UploadButton endpoint="templateFiles" onClientUploadComplete={res => setForm({...form, metaUrl: res[0].url})}/>
          <UploadButton endpoint="templateFiles" onClientUploadComplete={res => setForm({...form, previewUrl: res[0].url})}/>
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Saving..." : "Save Template"}
        </button>
      </form>
    </div>
  );
}
