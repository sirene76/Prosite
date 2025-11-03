import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Website, { WebsiteDocument } from "@/models/Website";
import ContentEditor from "@/components/dashboard/ContentEditor";
import { CompleteSetupCard } from "@/components/dashboard/CompleteSetupCard";
import { SEOInsights } from "@/components/dashboard/SEOInsights";
import { SEOInsights } from "@/components/dashboard/SEOInsights";
import { isValidObjectId } from "mongoose";

/* ---------- small helpers ---------- */
function toPlainRecord(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value.entries());
  if (typeof value === "object") return value as Record<string, unknown>;
  return {};
}
function formatDateTime(value: unknown) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/* ---------- main page ---------- */
export default async function DashboardWebsitePage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/auth/login");

  const { websiteId } = await params;
  if (!websiteId || !isValidObjectId(websiteId)) notFound();

  await connectDB();
  const website = (await Website.findById(websiteId).lean()) as
    | (WebsiteDocument & { _id: string })
    | null;
  if (!website) notFound();

  const sessionWithId = session as typeof session & { userId?: string };
  const sessionUserId = sessionWithId.userId;
  if (
    (website.user && website.user !== session.user.email) ||
    (website.userId && sessionUserId && String(website.userId) !== sessionUserId)
  ) {
    notFound();
  }

  const deployment = toPlainRecord(website.deployment);
  const deploymentUrl =
    typeof deployment.url === "string" ? deployment.url : undefined;
  const lastDeployed = formatDateTime(deployment.lastDeployedAt);

  const seo = toPlainRecord(website.seo);
  const seoScore = typeof seo.score === "number" ? seo.score : null;
  const seoLastScan = formatDateTime(seo.lastScan);

  const siteName = website.name?.trim() || "Untitled Website";
  const sitePlan = website.plan || "Free";
  const billingCycle =
    typeof website.billingCycle === "string"
      ? website.billingCycle.charAt(0).toUpperCase() +
        website.billingCycle.slice(1)
      : null;
  const siteStatus = website.status || "preview";
  const siteSubdomain = website.subdomain || websiteId.slice(-6);

  const hasLiveSite = Boolean(deploymentUrl);
  const websiteValues = toPlainRecord(website.values);
  const websiteForEditor = {
    _id: String(website._id),
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

      {/* ---------- top cards ---------- */}
      <CompleteSetupCard
        websiteId={String(websiteForEditor._id)}
        siteStatus={siteStatus}
        siteValues={websiteValues}
        seoScore={seoScore}
        plan={sitePlan.toLowerCase()}
      />

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 p-6 bg-white">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Website status
          </h2>
          <p className="mt-3 text-lg font-semibold text-gray-900">{siteStatus}</p>
          <p className="mt-1 text-sm text-gray-500">
            Plan: {sitePlan}
            {billingCycle && (
              <span className="text-gray-400"> · {billingCycle}</span>
            )}
          </p>
          {lastDeployed && (
            <p className="mt-2 text-sm text-gray-400">
              Last deployed {lastDeployed}
            </p>
          )}
        </div>

        <SEOInsights
          websiteId={String(websiteForEditor._id)}
          initialScore={seoScore}
          initialLastScan={seoLastScan}
        />
      </div>

      {/* ---------- content editor ---------- */}
      <div className="mt-10 rounded-lg border border-gray-200 p-6 bg-white">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Content</h2>
          <p className="text-xs uppercase tracking-wide text-gray-400">
            Live Editing
          </p>
        </div>
        <ContentEditor website={websiteForEditor} />
      </div>
    </div>
  );
}
