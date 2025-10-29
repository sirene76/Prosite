import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { isValidObjectId } from "mongoose";
import { headers, cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Website from "@/models/Website";

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

function formatDate(value: unknown) {
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

function toCookieHeader(): string | undefined {
  const cookieStore = cookies();
  const values = cookieStore.getAll();
  if (!values.length) {
    return undefined;
  }

  return values.map((entry) => `${entry.name}=${entry.value}`).join("; ");
}

export default async function DashboardSeoPage({
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
  if (
    (website.user && website.user !== session.user.email) ||
    (website.userId && sessionWithId.userId && String(website.userId) !== sessionWithId.userId)
  ) {
    notFound();
  }

  const seo = toPlainRecord(website.seo);
  const score = typeof seo.score === "number" ? Math.round(seo.score) : null;
  const lastScan = formatDate(seo.lastScan);
  const suggestionsRaw = Array.isArray(seo.suggestions)
    ? (seo.suggestions as unknown[])
    : [];
  const suggestions = suggestionsRaw
    .map((value) => (typeof value === "string" ? value : String(value)))
    .filter((value) => value.trim().length > 0);

  const headersList = headers();
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? "http";
  const baseUrl =
    host
      ? `${protocol}://${host}`
      : process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;

  async function runSeoScan() {
    "use server";
    if (!baseUrl) {
      throw new Error("Unable to determine application base URL");
    }

    const cookieHeader = toCookieHeader();
    const response = await fetch(`${baseUrl}/api/seo/${websiteId}/scan`, {
      method: "GET",
      headers: cookieHeader
        ? {
            Cookie: cookieHeader,
          }
        : undefined,
      cache: "no-store",
    });

    if (!response.ok) {
      const details = await response.text();
      console.error("SEO scan request failed", response.status, details);
      throw new Error("SEO scan failed");
    }

    revalidatePath(`/dashboard/${websiteId}/seo`);
    revalidatePath(`/dashboard/${websiteId}`);
  }

  return (
    <div className="max-w-3xl px-6 py-10 mx-auto">
      <div className="mb-8">
        <a
          href={`/dashboard/${websiteId}`}
          className="text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          ← Back to overview
        </a>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">SEO insights</h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor your site health and uncover quick wins.
            </p>
          </div>

          <form action={runSeoScan}>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              Run New Scan
            </button>
          </form>
        </div>

        <div className="mt-8 space-y-6">
          <div className="rounded-lg border border-gray-200 p-6">
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
              Current SEO Score
            </p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {typeof score === "number" ? `${score} / 100` : "No scan data yet"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Last Scan: {lastScan ?? "Not yet scanned"}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-6">
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
              Suggestions
            </p>
            {suggestions.length > 0 ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-700">
                {suggestions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-gray-500">
                No suggestions yet. Run a scan to generate recommendations.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
