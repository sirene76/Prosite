/* eslint-disable @next/next/no-img-element */
import { connectDB } from "@/lib/mongodb";
import { Template } from "@/models/template";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  await connectDB();
  const templates = await Template.find().sort({ createdAt: -1 }).lean();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Templates</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {templates.map((tpl) => (
          <div
            key={tpl._id.toString()}
            className="border rounded-lg overflow-hidden shadow hover:shadow-md transition"
          >
            <img
              src={tpl.image}
              alt={tpl.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-4 space-y-1">
              <h2 className="font-semibold text-lg">{tpl.name}</h2>
              <p className="text-sm text-gray-500">{tpl.category}</p>
              <p className="text-sm text-gray-600 line-clamp-2">
                {tpl.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
