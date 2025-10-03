import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import { Website } from "@/models/Website";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    redirect("/api/auth/signin?callbackUrl=/dashboard");
  }

  await connectDB();

  const websites = await Website.find({
    user: email,
    status: "active",
  })
    .sort({ createdAt: -1 })
    .lean();

  const siteCards = websites.map((site) => ({
    id: site._id.toString(),
    name: site.name ?? "Untitled website",
    plan: typeof site.plan === "string" ? site.plan : "not set",
    createdAt: site.createdAt ? new Date(site.createdAt).toLocaleDateString() : "",
  }));

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-100">Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}</h1>
        <p className="text-sm text-slate-400">Review your active websites and manage ongoing engagements.</p>
      </header>

      {siteCards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800/70 bg-slate-900/40 p-10 text-center">
          <p className="text-base text-slate-300">No active websites yet. Complete checkout to activate your first project.</p>
        </div>
      ) : (
        <section className="grid gap-6 md:grid-cols-2">
          {siteCards.map((site) => (
            <article key={site.id} className="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-6">
              <h2 className="text-lg font-semibold text-slate-100">{site.name}</h2>
              <dl className="mt-4 space-y-2 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <dt>Plan</dt>
                  <dd className="capitalize">{site.plan}</dd>
                </div>
                {site.createdAt ? (
                  <div className="flex items-center justify-between">
                    <dt>Activated</dt>
                    <dd>{site.createdAt}</dd>
                  </div>
                ) : null}
              </dl>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
