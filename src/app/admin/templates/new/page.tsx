"use client";

import { TemplateForm } from "@/app/admin/templates/_components/TemplateForm";

export default function NewTemplatePage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold text-white">Add New Template</h1>
      <p className="text-slate-400 mb-8">
        Create a new website template by providing its HTML, CSS, and metadata.
      </p>
      <TemplateForm mode="create" />
    </div>
  );
}
