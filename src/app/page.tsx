import Image from "next/image";
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
          const version = tpl.versions?.find((v) => v.number === tpl.currentVersion);
          const previewUrl = version?.previewUrl || "/placeholder-template.svg";

          return (
            <div key={tpl._id} className="border rounded-lg overflow-hidden">
              <div className="w-full h-48 relative">
                <Image
                  src={previewUrl}
                  alt={tpl.name}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
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
