"use client";

import { useBuilderStore } from "@/store/builderStore";

type ContentField = {
  key: string;
  label: string;
  type?: string;
  default?: string;
};

type ContentEditorProps = {
  fields?: ContentField[];
};

export function ContentEditor({ fields }: ContentEditorProps) {
  const values = useBuilderStore((state) => state.values);
  const updateValue = useBuilderStore((state) => state.updateValue);

  if (!fields || fields.length === 0) {
    return <p className="text-sm text-slate-400">No editable fields found for this template.</p>;
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
      {fields.map((field) => (
        <div key={field.key} className="space-y-1">
          <label className="block text-sm font-medium text-slate-100" htmlFor={field.key}>
            {field.label}
          </label>
          {field.type === "textarea" ? (
            <textarea
              id={field.key}
              className="w-full border border-gray-800 rounded-lg bg-gray-950/60 p-3 text-sm text-slate-100 focus:border-builder-accent focus:outline-none"
              value={toInputValue(resolveFieldValue(values[field.key], field.default))}
              onChange={(event) => updateValue(field.key, event.target.value)}
              rows={4}
            />
          ) : (
            <input
              id={field.key}
              type="text"
              className="w-full border border-gray-800 rounded-lg bg-gray-950/60 p-3 text-sm text-slate-100 focus:border-builder-accent focus:outline-none"
              value={toInputValue(resolveFieldValue(values[field.key], field.default))}
              onChange={(event) => updateValue(field.key, event.target.value)}
            />
          )}
        </div>
      ))}
    </form>
  );
}

function toInputValue(value: unknown) {
  if (value === undefined || value === null) {
    return "";
  }
  return typeof value === "string" ? value : String(value);
}

function resolveFieldValue(value: unknown, fallback?: string) {
  if (value === undefined || value === null) {
    return fallback ?? "";
  }
  return value;
}
