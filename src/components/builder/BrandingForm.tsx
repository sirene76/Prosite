"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

export type BrandingValues = {
  websiteName: string;
  businessName: string;
  logo: string;
  color?: string;
};

export type BrandingFormProps = {
  websiteId?: string;
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

  const formId = useMemo(
    () => (websiteId ? `branding-${websiteId}` : "branding-form"),
    [websiteId]
  );

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-live="polite">
      <div className="space-y-2">
        <label
          className="block text-sm font-medium text-slate-700"
          htmlFor={`${formId}-website`}
        >
          Website Title
        </label>
        <input
          id={`${formId}-website`}
          value={values.websiteName}
          onChange={(event) => handleChange("websiteName", event.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="My Awesome Site"
        />
      </div>

      <div className="space-y-2">
        <label
          className="block text-sm font-medium text-slate-700"
          htmlFor={`${formId}-business`}
        >
          Business Name
        </label>
        <input
          id={`${formId}-business`}
          value={values.businessName}
          onChange={(event) => handleChange("businessName", event.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="e.g. John's Café"
        />
      </div>

      <div className="space-y-2">
        <label
          className="block text-sm font-medium text-slate-700"
          htmlFor={`${formId}-logo`}
        >
          Logo (optional)
        </label>
        <input
          id={`${formId}-logo`}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-500"
        />
        {values.logo ? (
          <div className="flex items-center justify-start">
            <Image
              src={values.logo}
              alt="Logo preview"
              width={160}
              height={64}
              unoptimized
              className="mt-3 h-16 w-auto rounded-lg border border-slate-200 bg-slate-50 object-contain px-4"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
