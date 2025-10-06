import Link from "next/link";
import Image from "next/image";

export default function TemplateNotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 text-center px-6">
      <Image
        src="/images/404-illustration.svg"
        alt="Template not found"
        width={200}
        height={200}
        className="opacity-80"
      />

      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-white">Template not found</h1>
        <p className="text-slate-400 max-w-md">
          The template you’re looking for doesn’t exist or was removed.  
          Please go back to the templates list and choose another design.
        </p>
      </div>

      <div className="flex gap-4">
        <Link
          href="/templates"
          className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-500 transition"
        >
          ← Back to templates
        </Link>

        <Link
          href="/"
          className="rounded-lg border border-slate-600 px-5 py-2.5 font-semibold text-slate-300 hover:bg-slate-800 transition"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
