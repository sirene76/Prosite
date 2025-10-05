"use client";
/* eslint-disable @next/next/no-img-element */

import { Fragment, type ChangeEvent } from "react";

import type { TemplateContentField, TemplateContentSection } from "@/context/BuilderContext";

const inputBaseClass =
  "w-full rounded-xl border border-gray-800 bg-gray-950/60 px-3 py-2 text-sm text-slate-100 transition focus:border-builder-accent focus:outline-none";

export type ContentFormProps = {
  section: TemplateContentSection;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
};

export function ContentForm({ section, values, onChange }: ContentFormProps) {
  return (
    <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
      {section.fields.map((field) => (
        <Fragment key={field.key}>{renderField(field, values[field.key] ?? "", onChange)}</Fragment>
      ))}
    </form>
  );
}

function renderField(
  field: TemplateContentField,
  value: string,
  onChange: (key: string, value: string) => void
) {
  const { key, label, type, placeholder, description } = field;

  if (type === "textarea") {
    return (
      <label className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
        <textarea
          value={value}
          onChange={(event) => onChange(key, event.target.value)}
          placeholder={placeholder ?? field.defaultValue ?? ""}
          rows={5}
          className={`${inputBaseClass} min-h-[140px] resize-y`}
        />
        {description ? <span className="text-[11px] text-slate-500">{description}</span> : null}
      </label>
    );
  }

  if (type === "image") {
    return (
      <ImageField
        label={label}
        value={value}
        fieldKey={key}
        description={description}
        onChange={onChange}
      />
    );
  }

  if (type === "color") {
    return (
      <label className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-950/50 p-3">
        <div
          className="h-10 w-10 flex-shrink-0 rounded-lg border border-white/10"
          style={{ backgroundColor: value || "transparent" }}
        />
        <div className="flex-1 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={ensureColorValue(value)}
              onChange={(event) => onChange(key, event.target.value)}
              className="h-9 w-16 cursor-pointer rounded border border-gray-800 bg-gray-900"
            />
            <input
              type="text"
              value={value}
              placeholder={placeholder ?? "#000000"}
              onChange={(event) => onChange(key, event.target.value)}
              className={`${inputBaseClass} text-xs`}
            />
          </div>
          {description ? <span className="text-[11px] text-slate-500">{description}</span> : null}
        </div>
      </label>
    );
  }

  const inputType = type === "email" ? "email" : "text";

  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <input
        type={inputType}
        value={value}
        placeholder={placeholder ?? field.defaultValue ?? ""}
        onChange={(event) => onChange(key, event.target.value)}
        className={inputBaseClass}
      />
      {description ? <span className="text-[11px] text-slate-500">{description}</span> : null}
    </label>
  );
}

function ensureColorValue(value: string | undefined) {
  if (!value) {
    return "#000000";
  }
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : "#000000";
}

type ImageFieldProps = {
  label: string;
  value: string;
  fieldKey: string;
  onChange: (key: string, value: string) => void;
  description?: string;
};

function ImageField({ label, value, onChange, fieldKey, description }: ImageFieldProps) {
  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      return;
    }

    const data = await response.json();

    if (data.url) {
      onChange(fieldKey, data.url as string);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</label>

      {value ? (
        <div className="relative">
          <img
            src={value}
            alt={label}
            className="h-40 w-full rounded-lg object-cover border border-gray-800"
          />
          <button
            type="button"
            onClick={() => onChange(fieldKey, "")}
            className="absolute right-2 top-2 rounded bg-black/60 px-2 py-1 text-xs text-white"
          >
            Remove
          </button>
        </div>
      ) : null}

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-blue-500"
      />

      {description ? <span className="text-[11px] text-slate-500">{description}</span> : null}
    </div>
  );
}
