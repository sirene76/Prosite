"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = userRole === "admin";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold text-white">
          Prosite
        </Link>

        <div className="flex items-center gap-4 text-sm font-medium">
          {!session ? (
            <>
              <Link
                href="/auth/login"
                className="rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
              >
                Sign in
              </Link>
              <Link
                href="/auth/register"
                className="rounded bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
              >
                Sign up
              </Link>
            </>
          ) : (
            <>
              <Link href="/dashboard" className="text-slate-300 transition hover:text-white">
                Dashboard
              </Link>
              <Link href="/builder" className="text-slate-300 transition hover:text-white">
                Builder
              </Link>
              {isAdmin ? (
                <Link href="/admin" className="text-slate-300 transition hover:text-white">
                  Admin
                </Link>
              ) : null}
              <span className="text-slate-300">Hello, {session.user?.email}</span>
              <button
                type="button"
                onClick={() => {
                  void signOut({ callbackUrl: "/" });
                }}
                className="rounded bg-red-500 px-4 py-2 text-white transition hover:bg-red-600"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
