import PreviewArea from "@/components/builder/PreviewArea";

export default function BrandingPage() {
  return (
    <div className="space-y-8 text-slate-100">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-400">
          Step 2 · Add Your Brand
        </p>
        <h1 className="text-3xl font-semibold">Make it yours</h1>
        <p className="max-w-xl text-sm text-slate-400">
          Give your site a name, add your business details, and see changes update instantly in the live preview.
        </p>
      </header>

      <PreviewArea />
    </div>
  );
}
