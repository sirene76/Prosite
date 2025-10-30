"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

export type BrandingValues = {
  websiteName: string;
  businessName: string;
  logo: string;
  color: string;
};

export type BrandingFormProps = {
  websiteId: string;
  initialValues?: Partial<BrandingValues>;
  onChange?: (values: BrandingValues) => void;
};

const DEFAULT_VALUES: BrandingValues = {
  websiteName: "",
  businessName: "",
  logo: "",
  color: "#3b82f6",
};

export default function BrandingForm({
  websiteId,
  initialValues,
  onChange,
}: BrandingFormProps) {
  const [values, setValues] = useState<BrandingValues>(() => ({
    ...DEFAULT_VALUES,
    ...(initialValues ?? {}),
  }));

  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    setValues({
      ...DEFAULT_VALUES,
      ...(initialValues ?? {}),
    });
  }, [initialValues]);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  const handleChange = (key: keyof BrandingValues, val: string) => {
    setValues((current) => {
      if (current[key] === val) {
        return current;
      }
      const next: BrandingValues = {
        ...current,
        [key]: val,
      };
      onChange?.(next);
      return next;
    });
  };

  const handleFile: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }

    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    handleChange("logo", url);
  };

  const formId = useMemo(() => `branding-${websiteId}`, [websiteId]);

  return (
    <div className="space-y-4" aria-live="polite">
      <div>
        <label className="block text-sm font-semibold text-slate-200" htmlFor={`${formId}-website`}>
          Website Name
        </label>
        <input
          id={`${formId}-website`}
          value={values.websiteName}
          onChange={(event) => handleChange("websiteName", event.target.value)}
          className="mt-1 w-full rounded border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="My Awesome Site"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-200" htmlFor={`${formId}-business`}>
          Business Name
        </label>
        <input
          id={`${formId}-business`}
          value={values.businessName}
          onChange={(event) => handleChange("businessName", event.target.value)}
          className="mt-1 w-full rounded border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Acme Co."
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-200" htmlFor={`${formId}-logo`}>
          Logo
        </label>
        <input
          id={`${formId}-logo`}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="mt-1 block w-full text-sm text-slate-200 file:mr-4 file:rounded file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-500"
        />
        {values.logo ? (
          <div className="mt-3 inline-flex min-h-[4rem] items-center rounded bg-white/5 p-2">
            <Image
              src={values.logo}
              alt="Logo preview"
              width={160}
              height={64}
              className="h-16 w-auto object-contain"
              unoptimized
            />
          </div>
        ) : null}
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-200" htmlFor={`${formId}-color`}>
          Primary Color
        </label>
        <input
          id={`${formId}-color`}
          type="color"
          value={values.color}
          onChange={(event) => handleChange("color", event.target.value)}
          className="mt-1 h-10 w-20 cursor-pointer rounded border border-slate-800 bg-transparent"
          aria-label="Primary brand color"
        />
      </div>
    </div>
  );
}
