import Image from "next/image";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Website } from "@/models/website";
import { getTemplates } from "@/lib/templates";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  await connectDB();
  const websites = await Website.find({ user: session.user.email }).sort({ createdAt: -1 }).lean();
  const templateDefinitions = await getTemplates();
  const templateMap = new Map(templateDefinitions.map((template) => [template.id, template]));

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Your Websites</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {websites.map((site) => {
          const siteKey =
            typeof site._id === "object" && site._id !== null && "toString" in site._id
              ? site._id.toString()
              : String(site._id ?? site.templateId ?? site.name ?? "site");

          const template = templateMap.get(site.templateId ?? "");

          return (
            <div
              key={siteKey}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative h-44 w-full bg-slate-100">
                {template?.previewImage ? (
                  <Image
                    src={template.previewImage}
                    alt={`${template.name} preview`}
                    fill
                    sizes="(min-width: 1280px) 320px, (min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs font-medium uppercase tracking-[0.3em] text-slate-400">
                    No preview
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                    {template?.name ?? "Unknown template"}
                  </p>
                </div>
              </div>

              <div className="space-y-2 p-5">
                <h2 className="text-lg font-semibold text-slate-900">{site.name ?? "Untitled Website"}</h2>
                <p className="text-sm text-slate-500">
                  Template: <span className="font-medium text-slate-700">{template?.name ?? site.templateId ?? "Unknown"}</span>
                </p>
                <p className="text-sm text-slate-500">Status: {site.status ?? "unknown"}</p>
                {site.plan && <p className="text-sm text-slate-500">Plan: {site.plan}</p>}
              </div>
            </div>
          );
        })}
        {!websites.length && (
          <div className="text-sm text-gray-600">No websites yet. Start by selecting a template.</div>
        )}
      </div>
    </main>
  );
}
