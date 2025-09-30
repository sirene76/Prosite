import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-8 px-4 text-center">
      <span className="rounded-full bg-builder-surface px-4 py-1 text-sm font-medium text-slate-300">
        Prosite Builder
      </span>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        Launch your next professional website in minutes.
      </h1>
      <p className="max-w-2xl text-lg text-slate-300">
        Choose a premium template, customize every detail with our intuitive builder, and publish with a
        subscription powered by Stripe.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          className="rounded-full bg-builder-accent px-6 py-3 text-base font-semibold text-slate-900 shadow-lg shadow-sky-500/30 transition hover:brightness-110"
          href="/builder/theme"
        >
          Start Building
        </Link>
        <Link
          className="rounded-full border border-slate-600 px-6 py-3 text-base font-semibold text-slate-200 transition hover:border-builder-accent hover:text-builder-accent"
          href="#"
        >
          Explore Templates
        </Link>
      </div>
    </main>
  );
}
