import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Website, { WebsiteDocument } from "@/models/Website";

interface DashboardSite {
  id: string;
  name: string;
  plan: string;
  billingCycle?: string;
  status: string;
}

function toDashboardSite(value: unknown): DashboardSite | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const idRaw = record._id;
  const id =
    typeof idRaw === "string"
      ? idRaw
      : typeof idRaw === "object" && idRaw !== null && "toString" in idRaw
      ? String((idRaw as { toString: () => string }).toString())
      : "";

  if (!id) return null;

  const name =
    typeof record.name === "string" && record.name.trim().length > 0
      ? record.name
      : "Untitled Website";

  const plan =
    typeof record.plan === "string" && record.plan.length > 0
      ? record.plan.charAt(0).toUpperCase() + record.plan.slice(1)
      : "Free";

  const billingCycle =
    typeof record.billingCycle === "string" && record.billingCycle.length > 0
      ? record.billingCycle.charAt(0).toUpperCase() + record.billingCycle.slice(1)
      : undefined;

  const status =
    typeof record.status === "string" && record.status.length > 0
      ? record.status
      : "preview";

  return { id, name, plan, billingCycle, status };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/auth/login");

  await connectDB();
  const websites = (await Website.find({ user: session.user.email })
    .sort({ createdAt: -1 })
    .lean()) as (WebsiteDocument & { _id: string })[];

  const dashboardSites = websites
    .map(toDashboardSite)
    .filter((site): site is DashboardSite => Boolean(site));

  return (
    <div className="max-w-5xl px-6 py-10 mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">My Websites</h1>
        <p className="mt-2 text-sm text-gray-500">
          Manage and redeploy your published Prosite projects.
        </p>
      </div>

      {dashboardSites.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-base font-medium text-gray-700">
            You don&apos;t have any websites yet.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Create or deploy a project to see it listed here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {dashboardSites.map((site) => (
            <div
              key={site.id}
              className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{site.name}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                    Plan: {site.plan}
                    {site.billingCycle && (
                      <span className="text-gray-400"> · {site.billingCycle}</span>
                    )}
                  </span>
                  <StatusBadge status={site.status} />
                </div>
              </div>

              <Link
                href={`/dashboard/${site.id}`}
                className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
              >
                Manage
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.trim().toLowerCase();

  const badgeStyles: Record<string, string> = {
    active: "rounded-full bg-emerald-50 px-3 py-1 text-emerald-700",
    preview: "rounded-full bg-amber-50 px-3 py-1 text-amber-700",
    default: "rounded-full bg-gray-100 px-3 py-1 text-gray-700",
  };

  const className = badgeStyles[normalizedStatus] ?? badgeStyles.default;
  const label = normalizedStatus
    ? normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)
    : "Unknown";

  return <span className={className}>Status: {label}</span>;
}
