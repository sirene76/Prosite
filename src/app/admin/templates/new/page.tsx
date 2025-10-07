"use client";

import { TemplateForm } from "@/app/admin/templates/_components/TemplateForm";

export default function NewTemplatePage() {
  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-3xl font-semibold mb-4 text-white">Add New Template</h1>
      <p className="text-slate-400 mb-8">
        Create a new template with HTML, CSS, and metadata. You can upload a preview image or use
        an external URL.
      </p>
      <TemplateForm mode="create" />
    </div>
  );
}
