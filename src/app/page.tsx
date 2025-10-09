import Image from "next/image";

import { getTemplates } from "@/lib/templates";

export default async function HomePage() {
  const templates = await getTemplates();

  return (
    <main className="grid grid-cols-3 gap-6 p-8">
      {templates.map((tpl) => (
        <div key={tpl._id} className="border rounded-lg overflow-hidden">
          <div className="w-full h-48 relative">
            <Image
              src={tpl.previewUrl ?? "/placeholder-template.svg"}
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
      ))}
    </main>
  );
}
