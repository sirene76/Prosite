import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-6 py-12 text-center text-slate-100">
      <div className="max-w-lg space-y-4 rounded-2xl border border-emerald-500/40 bg-gray-900/60 p-8 shadow-lg shadow-emerald-500/20">
        <h1 className="text-3xl font-bold text-emerald-400">Payment Successful</h1>
        <p className="text-sm text-slate-300">
          Thank you for upgrading! Your subscription is now active and you can continue customizing your site in the
          builder.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
          >
            Go to dashboard
          </Link>
          <Link
            href="/builder/templates"
            className="rounded-lg border border-emerald-500/50 px-6 py-3 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400/80"
          >
            Continue building
          </Link>
        </div>
      </div>
    </div>
  );
}
