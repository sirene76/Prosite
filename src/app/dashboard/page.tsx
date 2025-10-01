import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">Dashboard</h1>
        <p className="mt-2 text-base text-slate-300">
          Signed in as <span className="font-semibold text-white">{session.user.email}</span>.
        </p>
      </div>
    </div>
  );
}
