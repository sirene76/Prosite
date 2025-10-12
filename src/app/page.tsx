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
        {templates.map((tpl) => {
          return (
            <div key={tpl._id} className="border rounded-lg overflow-hidden">
              <div className="w-full h-48">
                {tpl.previewVideo ? (
                  <video
                    src={tpl.previewVideo}
                    muted
                    autoPlay
                    loop
                    playsInline
                    className="h-full w-full object-cover"
                  />
                ) : tpl.thumbnail ? (
                  <img
                    src={tpl.thumbnail}
                    alt={tpl.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="bg-gray-100 w-full h-full flex items-center justify-center text-gray-400">
                    No Preview
                  </div>
                )}
              </div>
              <div className="p-4">
                <h2 className="font-semibold text-lg">{tpl.name}</h2>
                <p className="text-sm text-gray-600">{tpl.description}</p>
                <a href={`/templates/${tpl._id}`} className="btn-primary mt-2 inline-block">
                  Select
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
