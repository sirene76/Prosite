import type { Types } from "mongoose";

import WebsitesTable from "@/components/admin/WebsitesTable";
import { connectDB } from "@/lib/mongodb";
import Website from "@/models/Website";

type LeanWebsite = {
  _id: Types.ObjectId;
  userEmail?: string | null;
  user?: string | null;
  templateId?: string | null;
  plan?: string | null;
  status?: string | null;
  seo?: { score?: number | null } | null;
};

export default async function AdminWebsitesPage() {
  await connectDB();

  const rawSites = await Website.find()
    .sort({ createdAt: -1 })
    .lean<LeanWebsite>();

  const sites = rawSites.map((site) => ({
    _id: site._id.toString(),
    userEmail: site.userEmail ?? site.user ?? "",
    templateId: site.templateId ?? "",
    plan: site.plan ?? "",
    status: site.status ?? "",
    seo: {
      score: typeof site.seo?.score === "number" ? site.seo.score : null,
    },
  }));

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-white">Client Websites</h1>
      <p className="mt-2 text-slate-400">
        Review active deployments, plans, and SEO signals across the platform.
      </p>
      <WebsitesTable sites={sites} />
    </section>
  );
}
