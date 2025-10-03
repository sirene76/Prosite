import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Website } from "@/models/website";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  await connectDB();
  const websites = await Website.find({ user: session.user.email }).sort({ createdAt: -1 }).lean();

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Your Websites</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {websites.map((site) => {
          const siteKey =
            typeof site._id === "object" && site._id !== null && "toString" in site._id
              ? site._id.toString()
              : String(site._id ?? site.templateId ?? site.name ?? "site");

          return (
            <div key={siteKey} className="border rounded-lg p-4 shadow">
              <h2 className="text-lg font-semibold">{site.name ?? "Untitled Website"}</h2>
              <p className="text-sm text-gray-600">Template: {site.templateId ?? "Unknown"}</p>
              <p className="text-sm text-gray-600">Status: {site.status ?? "unknown"}</p>
              {site.plan && <p className="text-sm text-gray-600">Plan: {site.plan}</p>}
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
