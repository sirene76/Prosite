import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-6 py-12 text-center text-slate-100">
      <div className="max-w-lg space-y-4 rounded-2xl border border-red-500/40 bg-gray-900/60 p-8 shadow-lg shadow-red-500/20">
        <h1 className="text-3xl font-bold text-red-400">Payment Cancelled</h1>
        <p className="text-sm text-slate-300">
          Your payment was cancelled before completion. You can return to the builder to review your site or try the
          checkout again whenever you are ready.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/builder/templates"
            className="rounded-lg bg-red-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
          >
            Back to builder
          </Link>
          <Link
            href="/support"
            className="rounded-lg border border-red-500/50 px-6 py-3 text-sm font-semibold text-red-300 transition hover:border-red-400/80"
          >
            Contact support
          </Link>
        </div>
      </div>
    </div>
  );
}
