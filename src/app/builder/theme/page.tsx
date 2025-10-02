"use client";

import { useBuilder } from "@/context/BuilderContext";

export default function ThemePage() {
  const { selectedTemplate, theme, themeDefaults } = useBuilder();

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold">Personalize the look &amp; feel</h2>
        <p className="text-sm text-slate-400">
          Adjust color tokens and typography directly from the inspector. The controls adapt to each template&apos;s design
          system so you only tweak what matters.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6">
        <h3 className="text-lg font-semibold text-slate-100">Template tokens</h3>
        <p className="mt-1 text-sm text-slate-400">
          {selectedTemplate.name} exposes color and font tokens you can fine tune. Use the sidebar to update them in real
          time.
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Colors</p>
            <div className="flex flex-wrap gap-3">
              {selectedTemplate.colors.map((color) => {
                const key = color.id;
                const value = theme.colors[key] ?? themeDefaults.colors[key] ?? color.default ?? "";
                return (
                  <div
                    key={key}
                    className="flex items-center gap-3 rounded-xl border border-slate-800/70 bg-slate-950/60 px-3 py-2"
                  >
                    <span
                      className="h-8 w-8 flex-shrink-0 rounded-full border border-white/10"
                      style={{ backgroundColor: value || "transparent" }}
                    />
                    <div className="flex flex-col text-xs text-slate-400">
                      <span className="font-semibold text-slate-200">
                        {color.label ?? formatTokenLabel(key)}
                      </span>
                      <span className="text-[11px] text-slate-500">{value || "Template default"}</span>
                    </div>
                  </div>
                );
              })}
              {!selectedTemplate.colors.length ? (
                <p className="text-xs text-slate-500">No color tokens defined in meta.json.</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Fonts</p>
            <div className="space-y-2">
              {selectedTemplate.fonts.map((token) => (
                <div
                  key={token}
                  className="rounded-xl border border-slate-800/70 bg-slate-950/60 px-3 py-2 text-xs text-slate-400"
                >
                  <span className="font-semibold text-slate-200">{formatTokenLabel(token)}</span>
                  <div className="mt-1 text-[11px] text-slate-500">{theme.fonts[token] ?? themeDefaults.fonts[token] ?? "Template default"}</div>
                </div>
              ))}
              {!selectedTemplate.fonts.length ? (
                <p className="text-xs text-slate-500">No font tokens defined in meta.json.</p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6">
        <h3 className="text-lg font-semibold text-slate-100">Sections</h3>
        <p className="mt-1 text-sm text-slate-400">
          The template ships with these content areas. Use them to plan your storytelling.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {selectedTemplate.sections.map((section) => {
            const label = section.label ?? formatTokenLabel(section.id);
            return (
              <span
                key={section.id}
                className="rounded-full border border-slate-800/70 bg-slate-950/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300"
              >
                {label}
              </span>
            );
          })}
          {!selectedTemplate.sections.length ? (
            <p className="text-xs text-slate-500">No sections defined in meta.json.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function formatTokenLabel(token: string) {
  return token
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (match) => match.toUpperCase());
}
