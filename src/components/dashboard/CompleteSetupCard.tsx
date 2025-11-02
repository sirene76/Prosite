"use client";

import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";

function hasNonEmptyContent(values: Record<string, unknown> | null | undefined) {
  if (!values) return false;

  const visited = new WeakSet<object>();

  const checkValue = (value: unknown): boolean => {
    if (value == null) return false;

    if (typeof value === "string") {
      return value.trim().length > 0;
    }

    if (typeof value === "number") {
      return !Number.isNaN(value);
    }

    if (typeof value === "boolean") {
      return value;
    }

    if (value instanceof Date) {
      return true;
    }

    if (Array.isArray(value)) {
      return value.some(checkValue);
    }

    if (typeof value === "object") {
      if (visited.has(value as object)) return false;
      visited.add(value as object);
      return Object.values(value as Record<string, unknown>).some(checkValue);
    }

    return false;
  };

  return checkValue(values);
}

export type CompleteSetupCardProps = {
  websiteId: string;
  siteStatus: string | null | undefined;
  siteValues: Record<string, unknown> | null | undefined;
  seoScore: number | null | undefined;
};

export function CompleteSetupCard({
  websiteId,
  siteStatus,
  siteValues,
  seoScore,
}: CompleteSetupCardProps) {
  const contentDone = hasNonEmptyContent(siteValues);
  const seoDone = typeof seoScore === "number" && seoScore > 0;
  const redeployDone = siteStatus === "active";

  const steps = [
    {
      id: "branding",
      label: "Branding",
      description: "Customize your logo, colors, and typography in the builder.",
      completed: true,
      href: `/builder/${websiteId}/theme`,
    },
    {
      id: "content",
      label: "Add Content",
      description: "Fill in your headlines, services, and contact information.",
      completed: contentDone,
      href: `/dashboard/${websiteId}#content-editor`,
    },
    {
      id: "seo",
      label: "Run SEO Scan",
      description: "Scan your live site to uncover optimization opportunities.",
      completed: seoDone,
      href: `/dashboard/${websiteId}#seo-insights`,
    },
    {
      id: "redeploy",
      label: "Redeploy",
      description: "Push your latest updates live once everything looks good.",
      completed: redeployDone,
      href: `/dashboard/${websiteId}#redeploy`,
    },
  ] as const;

  const totalSteps = steps.length;
  const completedSteps = steps.filter((step) => step.completed).length;
  const progress = Math.round((completedSteps / totalSteps) * 100);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Onboarding Checklist
          </p>
          <h2 className="mt-1 text-xl font-semibold text-gray-900">
            Complete your website
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Finish the remaining steps below to launch with confidence.
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Progress
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{progress}%</p>
          <p className="text-xs text-gray-400">
            {completedSteps} of {totalSteps} steps complete
          </p>
        </div>
      </div>

      <div className="mt-6 h-2 w-full rounded-full bg-gray-100">
        <div
          className="h-2 rounded-full bg-blue-600 transition-all"
          style={{ width: `${progress}%` }}
          aria-hidden="true"
        />
      </div>

      <ul className="mt-6 space-y-4">
        {steps.map((step) => (
          <li
            key={step.id}
            className="flex items-start justify-between gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4"
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${
                  step.completed
                    ? "border-green-100 bg-green-50 text-green-600"
                    : "border-gray-200 bg-white text-gray-400"
                }`}
              >
                {step.completed ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{step.label}</p>
                <p className="mt-1 text-sm text-gray-500">{step.description}</p>
              </div>
            </div>

            {!step.completed && (
              <Link
                href={step.href}
                className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-500"
              >
                Start →
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
