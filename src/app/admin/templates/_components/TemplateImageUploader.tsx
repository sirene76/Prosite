"use client";

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

type TemplateImageUploaderProps = {
  label?: string;
  disabled?: boolean;
  className?: string;
  onUploadComplete: (urls: string | string[]) => void;
};

export function TemplateImageUploader({
  label,
  disabled = false,
  className,
  onUploadComplete,
}: TemplateImageUploaderProps) {
  const { startUpload, isUploading } = useUploadThing("templateAssets");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputId = useId();

  const handleUpload = useCallback(
    async (files: File[]) => {
      if (!files.length) {
        return;
      }

      try {
        const result = await startUpload(files);
        const uploads = (result ?? [])
          .map((item) => item?.url ?? "")
          .filter((url): url is string => typeof url === "string" && url.length > 0);

        if (!uploads.length) {
          return;
        }

        onUploadComplete(uploads.length === 1 ? uploads[0] : uploads);
      } catch (error) {
        console.error("Template image upload failed", error);
      }
    },
    [onUploadComplete, startUpload]
  );

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (disabled || isUploading) {
        event.target.value = "";
        return;
      }

      const files = Array.from(event.target.files ?? []);
      event.target.value = "";
      void handleUpload(files);
    },
    [disabled, handleUpload, isUploading]
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

      void handleUpload(files);
    },
    [disabled, handleUpload, isUploading]
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

        <div className="space-y-1">
          <p className="text-sm">Drag & drop an image or click to upload</p>
          <p className="text-xs text-slate-500">PNG, JPG, or GIF up to 10MB</p>
        </div>

        {isUploading ? (
          <p className="text-xs text-blue-400">Uploading...</p>
        ) : null}
      </div>
    </div>
  );
}
