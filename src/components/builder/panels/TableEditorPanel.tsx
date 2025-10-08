"use client";

import { useEffect, useMemo, useState } from "react";

import { useBuilder } from "@/context/BuilderContext";
import type { BuilderPanel } from "@/lib/templates";

export function TableEditorPanel({ panel }: { panel: BuilderPanel }) {
  const { content, updateContent } = useBuilder();
  const key = panel.storageKey;
  const columns = useMemo(() => panel.fields ?? ["name", "price", "description"], [panel.fields]);
  const initial = Array.isArray(content[key]) ? (content[key] as Record<string, string>[]) : [];
  const [rows, setRows] = useState<Record<string, string>[]>(initial);

  useEffect(() => {
    if (!Array.isArray(content[key])) {
      return;
    }
    const serialised = (content[key] as unknown[]).map((row) => ({
      ...columns.reduce((acc, col) => {
        const value = (row as Record<string, unknown>)[col];
        acc[col] = typeof value === "string" ? value : "";
        return acc;
      }, {} as Record<string, string>),
    }));
    setRows(serialised);
  }, [columns, content, key]);

  function addRow() {
    const empty: Record<string, string> = {};
    columns.forEach((c) => {
      empty[c] = "";
    });
    const next = [...rows, empty];
    setRows(next);
    updateContent(key, next);
  }

  function removeRow(index: number) {
    const next = rows.filter((_, i) => i !== index);
    setRows(next);
    updateContent(key, next);
  }

  function updateCell(index: number, col: string, value: string) {
    const next = rows.map((row, i) => (i === index ? { ...row, [col]: value } : row));
    setRows(next);
    updateContent(key, next);
  }

  return (
    <div className="space-y-3">
      <div className="overflow-auto rounded-md border border-slate-700">
        <table className="min-w-full text-sm text-slate-200">
          <thead className="bg-slate-800">
            <tr>
              {columns.map((c) => (
                <th key={c} className="px-3 py-2 text-left font-semibold capitalize">
                  {c}
                </th>
              ))}
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="odd:bg-slate-900 even:bg-slate-950">
                {columns.map((c) => (
                  <td key={c} className="px-3 py-2">
                    <input
                      className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-white"
                      value={row[c] ?? ""}
                      onChange={(event) => updateCell(i, c, event.target.value)}
                    />
                  </td>
                ))}
                <td className="px-3 py-2 text-right">
                  <button
                    className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-500"
                    onClick={() => removeRow(i)}
                    type="button"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        onClick={addRow}
        type="button"
      >
        Add Row
      </button>
    </div>
  );
}
