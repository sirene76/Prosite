import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-4xl font-semibold text-slate-100">Checkout canceled</h1>
      <p className="text-slate-300">
        Your payment was canceled before completion. You can resume checkout anytime from your dashboard.
      </p>
      <Link
        href="/dashboard"
        className="rounded-full bg-builder-accent px-6 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
      >
        Return to dashboard
      </Link>
    </main>
  );
}
