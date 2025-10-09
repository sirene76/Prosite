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
    htmlUrl: "",
    cssUrl: "",
    metaUrl: "",
    previewUrl: "",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/admin/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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
