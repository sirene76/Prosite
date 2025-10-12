"use client";

import Image from "next/image";
import { useForm } from "react-hook-form";

import { UploadButton } from "@/utils/uploadthing";

const inputClassName =
  "w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30";

export type TemplateFormValues = {
  name: string;
  slug?: string;
  category?: string;
  subcategory?: string;
  description?: string;
  tags?: string;
  currentVersion?: string;
  thumbnail?: string;
};

export type TemplateFormProps = {
  initialData?: Partial<TemplateFormValues> | null;
  onSubmit: (values: TemplateFormValues) => void | Promise<void>;
};

export function TemplateForm({ initialData, onSubmit }: TemplateFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<TemplateFormValues>({
    defaultValues: {
      name: initialData?.name ?? "",
      slug: initialData?.slug ?? "",
      category: initialData?.category ?? "",
      subcategory: initialData?.subcategory ?? "",
      description: initialData?.description ?? "",
      tags: initialData?.tags ?? "",
      currentVersion: initialData?.currentVersion ?? "",
      thumbnail: initialData?.thumbnail ?? "",
    },
  });

  const thumbnail = watch("thumbnail");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-300" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            {...register("name", { required: true })}
            className={inputClassName}
            placeholder="Modern Portfolio"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300" htmlFor="slug">
            Slug
          </label>
          <input id="slug" {...register("slug")} className={inputClassName} placeholder="modern-portfolio" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-300" htmlFor="category">
            Category
          </label>
          <input id="category" {...register("category")} className={inputClassName} placeholder="Portfolio" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300" htmlFor="subcategory">
            Subcategory
          </label>
          <input id="subcategory" {...register("subcategory")} className={inputClassName} placeholder="Landing Page" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          {...register("description")}
          className={`${inputClassName} min-h-[100px]`}
          placeholder="Short description of the template"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-300" htmlFor="tags">
            Tags
          </label>
          <input id="tags" {...register("tags")} className={inputClassName} placeholder="portfolio, minimal, dark" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300" htmlFor="currentVersion">
            Current Version
          </label>
          <input
            id="currentVersion"
            {...register("currentVersion")}
            className={inputClassName}
            placeholder="1.0.0"
          />
        </div>
      </div>

      <div>
        <label className="block font-medium text-sm mb-1">Thumbnail</label>
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt="Template thumbnail"
            width={320}
            height={200}
            className="rounded-lg object-cover border mb-2"
          />
        ) : (
          <div className="border rounded-lg h-40 flex items-center justify-center text-gray-400 mb-2">
            No thumbnail uploaded
          </div>
        )}

        <UploadButton
          endpoint="templateImage"
          onClientUploadComplete={(res) => {
            const url = res?.[0]?.url;
            if (url) {
              setValue("thumbnail", url, { shouldDirty: true });
            }
          }}
          onUploadError={(err) => console.error("Upload failed:", err)}
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-70"
        >
          {isSubmitting ? "Saving..." : "Save Template"}
        </button>
      </div>
    </form>
  );
}
