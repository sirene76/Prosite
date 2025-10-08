"use client";
/* eslint-disable @next/next/no-img-element */

import clsx from "clsx";
import {
  useCallback,
  useId,
  useRef,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";

import { useUploadThing } from "@/lib/uploadthing";

type ImageDropInputProps = {
  label?: string;
  value?: string;
  onChange: (url: string) => void;
  onClear?: () => void;
  description?: string;
  disabled?: boolean;
  className?: string;
};

export default function ImageDropInput({
  label,
  value,
  onChange,
  onClear,
  description,
  disabled = false,
  className,
}: ImageDropInputProps) {
  const { startUpload, isUploading } = useUploadThing("templateAssets");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputId = useId();

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) {
        return;
      }

      try {
        const result = await startUpload(files);
        const url = result?.[0]?.url;
        if (url) {
          onChange(url);
        }
      } catch (error) {
        console.error("Image upload failed", error);
      }
    },
    [onChange, startUpload]
  );

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (disabled || isUploading) {
        event.target.value = "";
        return;
      }

      const files = Array.from(event.target.files ?? []);
      event.target.value = "";
      void uploadFiles(files);
    },
    [disabled, isUploading, uploadFiles]
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (disabled || isUploading) {
        return;
      }

      const files = Array.from(event.dataTransfer?.files ?? []);
      if (!files.length) {
        return;
      }

      void uploadFiles(files);
    },
    [disabled, isUploading, uploadFiles]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) {
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        inputRef.current?.click();
      }
    },
    [disabled]
  );

  const handleClick = useCallback(() => {
    if (disabled) {
      return;
    }
    inputRef.current?.click();
  }, [disabled]);

  const handleClear = useCallback(() => {
    if (disabled || isUploading) {
      return;
    }

    if (onClear) {
      onClear();
      return;
    }

    onChange("");
  }, [disabled, isUploading, onChange, onClear]);

  return (
    <div className={clsx("space-y-2", className)}>
      {label ? (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
        >
          {label}
        </label>
      ) : null}

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDrop={handleDrop}
        onDragOver={(event) => event.preventDefault()}
        onDragEnter={(event) => event.preventDefault()}
        aria-disabled={disabled}
        className={clsx(
          "group relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-slate-700 bg-slate-900/40 px-4 py-6 text-center text-sm text-slate-400 transition",
          {
            "cursor-not-allowed opacity-60": disabled || isUploading,
            "cursor-pointer hover:border-blue-500 hover:text-slate-200": !disabled && !isUploading,
          }
        )}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled || isUploading}
        />

        {value ? (
          <div className="relative w-full">
            <img
              src={value}
              alt="Uploaded preview"
              className="h-48 w-full rounded-md border border-slate-800 object-cover"
            />
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleClear();
              }}
              disabled={disabled || isUploading}
              className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm">Drag & drop an image or click to upload</p>
            <p className="text-xs text-slate-500">PNG, JPG, or GIF up to 10MB</p>
          </div>
        )}

        {isUploading ? (
          <p className="text-xs text-blue-400">Uploading...</p>
        ) : null}
      </div>

      {description ? <p className="text-xs text-slate-500">{description}</p> : null}
    </div>
  );
}
