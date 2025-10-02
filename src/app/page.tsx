import Image from "next/image";
import Link from "next/link";

import { getTemplates } from "@/lib/templates";

export default async function HomePage() {
  const templates = await getTemplates();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <section className="text-center">
        <span className="inline-flex items-center justify-center rounded-full bg-builder-surface px-4 py-1 text-sm font-medium text-slate-300">
          Prosite Builder
        </span>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Choose a template to jumpstart your next website.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
          Every template is handcrafted with flexible sections and theme controls. Pick one to start customizing, then fine-tune colors, fonts, and content in minutes.
        </p>
      </section>

      <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => {
          const previewImage = template.previewImage || "/placeholder-template.svg";

          return (
            <article
              key={template.id}
              className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 shadow-lg shadow-slate-900/20 backdrop-blur transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-800">
                <Image
                  src={previewImage}
                  alt={`${template.name} preview`}
                  fill
                  sizes="(min-width: 1280px) 384px, (min-width: 640px) 50vw, 100vw"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">{template.name}</h2>
                  <p className="mt-1 text-sm text-slate-300">{template.description}</p>
                </div>
                {template.sections.length > 0 && (
                  <div className="mt-auto text-xs font-medium uppercase tracking-wide text-slate-400">
                    Includes: {template.sections.map((section) => section.label).join(", ")}
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-[0.3em] text-slate-500">Template</span>
                  <Link
                    href={`/builder/templates?template=${template.id}`}
                    className="inline-flex items-center justify-center rounded-full bg-builder-accent px-4 py-2 text-sm font-semibold text-slate-900 transition hover:brightness-110"
                  >
                    Select
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
