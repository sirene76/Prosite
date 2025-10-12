/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import { getTemplates } from "@/lib/templates";

type HomePageProps = {
  searchParams?: Promise<{ category?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const category = resolvedSearchParams?.category ?? "";
  const templates = await getTemplates(category || undefined);

  const categories = ["Agency", "Restaurant", "Portfolio", "E-commerce"];

  return (
    <main className="p-8">
      <div className="flex gap-4 mb-6">
        <Link
          href="/"
          className={`px-4 py-2 rounded-lg border ${
            category === "" ? "bg-gray-200 font-semibold" : "hover:bg-gray-50"
          }`}
        >
          All
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat}
            href={`/?category=${encodeURIComponent(cat)}`}
            className={`px-4 py-2 rounded-lg border ${
              cat === category ? "bg-gray-200 font-semibold" : "hover:bg-gray-50"
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {templates.map((tpl) => (
          <div
            key={tpl._id}
            className="group relative overflow-hidden rounded-lg border border-slate-800 bg-slate-900 transition-all hover:shadow-lg hover:shadow-blue-900/30"
          >
            <div className="relative w-full h-48 bg-slate-800">
              {tpl.previewVideo ? (
                <video
                  src={tpl.previewVideo}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
              ) : null}

              {tpl.thumbnail ? (
                <img
                  src={tpl.thumbnail}
                  alt={tpl.name}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                    tpl.previewVideo ? "opacity-100 group-hover:opacity-0" : ""
                  }`}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-500 text-sm">
                  No Preview
                </div>
              )}
            </div>

            <div className="p-4 z-10 relative bg-gradient-to-t from-black/60 via-black/20 to-transparent">
              <h2 className="font-semibold text-lg text-white mb-1">{tpl.name}</h2>
              <p className="text-sm text-slate-300 line-clamp-2">{tpl.description}</p>
              <a
                href={`/templates/${tpl._id}`}
                className="mt-2 inline-block rounded-md bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition"
              >
                Select
              </a>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
