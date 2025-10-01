"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/builder/templates", label: "Builder" },
];

function isActive(pathname: string, href: string) {
  if (href.startsWith("/builder")) {
    return pathname.startsWith("/builder");
  }
  return pathname === href;
}

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold text-white">
          Prosite
        </Link>

        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-4 text-sm font-medium text-slate-300 sm:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition hover:text-white ${
                  isActive(pathname, link.href) ? "text-white" : "text-slate-300"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {status === "loading" ? (
            <span className="h-9 w-24 animate-pulse rounded bg-slate-800" aria-hidden />
          ) : session ? (
            <button
              type="button"
              onClick={() => {
                void signOut({ callbackUrl: "/" });
              }}
              className="rounded bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/auth/login"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
