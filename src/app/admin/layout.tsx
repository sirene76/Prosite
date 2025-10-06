import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

import { authOptions } from "@/lib/auth";

const navigation = [
  { href: "/admin/templates", label: "Templates" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
    redirect("/auth/login");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10">
        <header className="flex flex-col gap-6 border-b border-slate-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">
              Manage templates and control what appears in the builder experience.
            </p>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-medium text-slate-300 transition hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        {children}
      </div>
    </main>
  );
}
