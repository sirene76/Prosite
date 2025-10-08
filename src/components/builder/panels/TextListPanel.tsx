"use client";

import { useEffect, useState } from "react";

import { useBuilder } from "@/context/BuilderContext";
import type { BuilderPanel } from "@/lib/templates";

export function TextListPanel({ panel }: { panel: BuilderPanel }) {
  const { content, updateContent } = useBuilder();
  const key = panel.storageKey;
  const initial = Array.isArray(content[key]) ? (content[key] as string[]) : [];
  const [items, setItems] = useState<string[]>(initial);

  useEffect(() => {
    if (!Array.isArray(content[key])) {
      return;
    }
    setItems(content[key] as string[]);
  }, [content, key]);

  const limit = panel.limit ?? 20;

  function addItem(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    const next = [...items, trimmed].slice(0, limit);
    setItems(next);
    updateContent(key, next);
  }

  function removeItem(index: number) {
    const next = items.filter((_, i) => i !== index);
    setItems(next);
    updateContent(key, next);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          placeholder="Type item and press Add"
          id={`text-${key}`}
        />
        <button
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          onClick={() => {
            const el = document.getElementById(`text-${key}`) as HTMLInputElement | null;
            if (el) {
              addItem(el.value);
              el.value = "";
            }
          }}
          type="button"
        >
          Add
        </button>
      </div>
      <ul className="space-y-2">
        {items.map((t, i) => (
          <li
            key={`${t}-${i}`}
            className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          >
            <span>{t}</span>
            <button
              className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-500"
              onClick={() => removeItem(i)}
              type="button"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
