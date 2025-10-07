"use client";

import { useEffect, useState } from "react";

import { useBuilder } from "@/context/BuilderContext";
import type { BuilderPanel } from "@/lib/templates";

export function ImageGridPanel({ panel }: { panel: BuilderPanel }) {
  const { content, updateContent } = useBuilder();
  const key = panel.storageKey;
  const initial = Array.isArray(content[key]) ? (content[key] as string[]) : [];
  const [images, setImages] = useState<string[]>(initial);

  useEffect(() => {
    if (!Array.isArray(content[key])) {
      return;
    }
    setImages(content[key] as string[]);
  }, [content, key]);

  const limit = panel.limit ?? 12;

  function addImage(url: string) {
    const next = [...images, url].slice(0, limit);
    setImages(next);
    updateContent({ [key]: next });
  }

  function removeImage(index: number) {
    const next = images.filter((_, i) => i !== index);
    setImages(next);
    updateContent({ [key]: next });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          placeholder="Paste image URL and press Add"
          id={`imgUrl-${key}`}
          type="url"
        />
        <button
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          onClick={() => {
            const el = document.getElementById(`imgUrl-${key}`) as HTMLInputElement | null;
            if (el && el.value.trim()) {
              addImage(el.value.trim());
              el.value = "";
            }
          }}
          type="button"
        >
          Add
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {images.map((src, i) => (
          <div key={`${src}-${i}`} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`img-${i}`} className="h-24 w-full rounded-md object-cover" />
            <button
              className="absolute right-1 top-1 rounded bg-black/60 px-2 py-1 text-xs text-white"
              onClick={() => removeImage(i)}
              type="button"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
