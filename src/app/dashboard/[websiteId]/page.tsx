import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { isValidObjectId } from "mongoose";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Website from "@/models/Website";
import ContentEditor from "@/components/dashboard/ContentEditor";

function toPlainRecord(value: unknown): Record<string, unknown> {
  if (!value) {
    return {};
  }

  if (value instanceof Map) {
    return Object.fromEntries(value.entries());
  }

  if (typeof value === "object") {
    return value as Record<string, unknown>;
  }

  return {};
}

function formatDateTime(value: unknown) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function DashboardWebsitePage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  const { websiteId } = await params;
  if (!websiteId || !isValidObjectId(websiteId)) {
    notFound();
  }

  await connectDB();
  const website = await Website.findById(websiteId).lean();
  if (!website) {
    notFound();
  }

  const sessionWithId = session as typeof session & { userId?: string };
  const sessionUserId = sessionWithId.userId;

  if (
    (website.user && website.user !== session.user.email) ||
    (website.userId && sessionUserId && String(website.userId) !== sessionUserId)
  ) {
    notFound();
  }

  const deployment = toPlainRecord(website.deployment);
  const deploymentUrl = typeof deployment.url === "string" ? deployment.url : undefined;
  const lastDeployed = formatDateTime(deployment.lastDeployedAt);

  const seo = toPlainRecord(website.seo);
  const seoScore = typeof seo.score === "number" ? seo.score : null;
  const seoLastScan = formatDateTime(seo.lastScan);

  const siteName =
    typeof website.name === "string" && website.name.trim().length > 0
      ? website.name
      : "Untitled Website";
  const sitePlan = typeof website.plan === "string" ? website.plan : "Free";
  const siteStatus = typeof website.status === "string" ? website.status : "preview";
  const siteSubdomain =
    typeof website.subdomain === "string" && website.subdomain
      ? website.subdomain
      : websiteId.slice(-6);

  const hasLiveSite = Boolean(deploymentUrl);
  const websiteValues = toPlainRecord(website.values);
  const websiteForEditor = {
    _id:
      typeof website._id === "string"
        ? website._id
        : website._id?.toString() ?? websiteId,
    values: websiteValues,
  };

  return (
    <div className="max-w-4xl px-6 py-10 mx-auto">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          ← Back to dashboard
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">{siteName}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {siteSubdomain}.prosite.com
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={hasLiveSite ? deploymentUrl : "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 ${
                hasLiveSite
                  ? "border-gray-300 text-gray-700 hover:bg-gray-50"
                  : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 pointer-events-none"
              }`}
              aria-disabled={!hasLiveSite}
            >
              View Live Site
            </a>

            <form action={`/api/websites/${websiteForEditor._id}/redeploy`} method="post">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                Redeploy
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Website status
            </h2>
            <p className="mt-3 text-lg font-semibold text-gray-900">{siteStatus}</p>
            <p className="mt-1 text-sm text-gray-500">Plan: {sitePlan}</p>
            {lastDeployed && (
              <p className="mt-2 text-sm text-gray-400">Last deployed {lastDeployed}</p>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              SEO insights
            </h2>
            <p className="mt-3 text-lg font-semibold text-gray-900">
              {typeof seoScore === "number" ? `${Math.round(seoScore)} / 100` : "No data"}
            </p>
            {seoLastScan ? (
              <p className="mt-2 text-sm text-gray-400">Last scan {seoLastScan}</p>
            ) : (
              <p className="mt-2 text-sm text-gray-400">Scan not yet run</p>
            )}
          </div>
        </div>

        <div className="mt-10 rounded-lg border border-gray-200 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Content</h2>
            <p className="text-xs uppercase tracking-wide text-gray-400">Live Editing</p>
          </div>
          <ContentEditor website={websiteForEditor} />
        </div>
      </div>
    </div>
  );
}
