/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import { connectDB } from "@/lib/mongodb";
import { Template } from "@/models/template";

import { TemplateGrid, type TemplateGridTemplate } from "./template-grid";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  await connectDB();
  const templates = await Template.find().sort({ createdAt: -1 }).lean();

  const templateSummaries: TemplateGridTemplate[] = templates.map((tpl) => ({
    _id: tpl._id.toString(),
    name: tpl.name,
    category: tpl.category,
    description: tpl.description,
    image: tpl.image,
    published: tpl.published ?? true,
  }));

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Templates</h1>

        <Link
          href="/admin/templates/new"
          className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition"
        >
          + Add Template
        </Link>
      </div>

      <TemplateGrid templates={templateSummaries} />
    </div>
  );
}
