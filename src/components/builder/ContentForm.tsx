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
      <label className="flex flex-col gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
        {value ? (
          <div className="flex flex-col gap-2 rounded-xl border border-gray-800 bg-gray-950/50 p-3">
            <img
              src={value}
              alt={label}
              className="h-40 w-full rounded-lg object-cover"
            />
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <button
                type="button"
                onClick={() => onChange(key, "")}
                className="rounded-lg border border-gray-800 px-3 py-1 font-medium text-slate-300 transition hover:border-rose-400/50 hover:text-white"
              >
                Remove image
              </button>
              <span className="truncate">{truncateValue(value)}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-xl border border-dashed border-gray-800 bg-gray-950/40 p-6 text-center">
            <span className="text-sm text-slate-400">Upload an image</span>
            <span className="text-[11px] uppercase tracking-[0.3em] text-slate-500">PNG, JPG, GIF</span>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(event) => handleFileUpload(event, key, onChange)}
          className="block text-xs text-slate-400"
        />
        {description ? <span className="text-[11px] text-slate-500">{description}</span> : null}
      </label>
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

function handleFileUpload(
  event: ChangeEvent<HTMLInputElement>,
  key: string,
  onChange: (key: string, value: string) => void
) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const result = typeof reader.result === "string" ? reader.result : "";
    onChange(key, result);
  };
  reader.readAsDataURL(file);
}

function ensureColorValue(value: string | undefined) {
  if (!value) {
    return "#000000";
  }
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : "#000000";
}

function truncateValue(value: string, maxLength = 32) {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength)}…`;
}
