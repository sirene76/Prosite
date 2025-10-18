import { getTemplateById } from "@/lib/templates";
import TemplateNotFound from "./not-found";
import Link from "next/link";
import Image from "next/image";
import { DEFAULT_TEMPLATE_THUMBNAIL } from "@/lib/constants";

export default async function TemplatePage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params; // ✅ required in Next.js 15

  try {
    const template = await getTemplateById(templateId);

    if (!template) {
      return <TemplateNotFound />;
    }

    const previewSrc =
      template.previewUrl ?? template.image ?? template.thumbnail ?? DEFAULT_TEMPLATE_THUMBNAIL;

    return (
      <main className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center py-16 px-4">
        <div className="max-w-5xl w-full text-center">
          <h1 className="text-4xl font-bold mb-4">{template.name}</h1>
          <p className="text-slate-400 mb-8">{template.description}</p>

          {previewSrc ? (
            <div className="relative w-full h-[420px] mb-10 rounded-xl overflow-hidden border border-slate-700">
              <Image
                src={previewSrc}
                alt={`${template.name} preview`}
                fill
                sizes="(min-width: 1024px) 896px, 100vw"
                className="object-cover"
              />
            </div>
          ) : null}

          <div className="flex justify-center gap-4">
            <Link
              href={`/builder/new?template=${template._id}`}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-md text-white font-medium"
            >
              Use this Template
            </Link>
            <Link
              href="/templates"
              className="px-6 py-3 border border-slate-600 rounded-md text-slate-300 hover:bg-slate-800"
            >
              Back to Templates
            </Link>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error("Template load error:", error);
    return <TemplateNotFound />;
  }
}
