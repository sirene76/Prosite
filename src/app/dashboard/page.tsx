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
  const websites = await Website.find({
    user: session.user.email,
    status: "active",
  }).sort({ createdAt: -1 });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">Dashboard</h1>
        <p className="mt-2 text-base text-slate-300">
          Signed in as <span className="font-semibold text-white">{session.user.email}</span>.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-100">Active websites</h2>
        {websites.length ? (
          <ul className="space-y-3">
            {websites.map((website) => (
              <li
                key={website.id}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-base font-semibold text-white">{website.name}</span>
                    <span className="text-xs uppercase tracking-wide text-slate-400">Plan: {website.plan ?? "unknown"}</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Activated {(website.updatedAt ?? website.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">No active websites yet. Complete checkout to activate your site.</p>
        )}
      </div>
    </div>
  );
}
