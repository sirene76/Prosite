"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircle as faEmptyCircle,
} from "@fortawesome/free-regular-svg-icons";

/* ---------- helper to check content completion ---------- */
function hasNonEmptyContent(values: Record<string, unknown> | null | undefined) {
  if (!values) return false;
  const visited = new WeakSet<object>();

  const checkValue = (value: unknown): boolean => {
    if (value == null) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (typeof value === "number") return !Number.isNaN(value);
    if (typeof value === "boolean") return value;
    if (value instanceof Date) return true;
    if (Array.isArray(value)) return value.some(checkValue);
    if (typeof value === "object") {
      if (visited.has(value as object)) return false;
      visited.add(value as object);
      return Object.values(value as Record<string, unknown>).some(checkValue);
    }
    return false;
  };

  return checkValue(values);
}

/* ---------- component ---------- */
export type CompleteSetupCardProps = {
  websiteId: string;
  siteStatus?: string | null;
  siteValues?: Record<string, unknown> | null;
  seoScore?: number | null;
  plan?: string | null;
};

export function CompleteSetupCard({
  websiteId,
  siteStatus,
  siteValues,
  seoScore,
  plan,
}: CompleteSetupCardProps) {
  const effectivePlan: "basic" | "standard" | "premium" =
    plan === "basic" || plan === "standard" || plan === "premium"
      ? plan
      : "basic";

  const contentDone = hasNonEmptyContent(siteValues);
  const seoDone = typeof seoScore === "number" && seoScore > 0;
  const redeployDone = siteStatus === "active";

  type Step = {
    id: string;
    label: string;
    description: string;
    completed: boolean;
    href: string;
  };

  const baseSteps: Step[] = [
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
  ];

  const steps: Step[] = baseSteps.map((step) => {
    if (effectivePlan !== "standard") return { ...step };

    if (step.id === "content") {
      return {
        ...step,
        label: "Enhance Content Quality",
        description: "Refine your copy with AI-assisted suggestions in the editor.",
      };
    }

    if (step.id === "seo") {
      return {
        ...step,
        label: "Optimize SEO Automatically",
        description: "Let the AI SEO assistant run scans and recommend fixes.",
      };
    }

    return { ...step };
  });

  const premiumSummary = [
    "Branding complete ✅",
    "AI SEO agent running 🤖",
    "Next strategy review 📅",
  ];

  const totalSteps =
    effectivePlan === "premium" ? premiumSummary.length : steps.length;
  const completedSteps =
    effectivePlan === "premium"
      ? premiumSummary.length
      : steps.filter((s) => s.completed).length;
  const progress =
    effectivePlan === "premium"
      ? 100
      : Math.round((completedSteps / totalSteps) * 100);

  const headerCopy = {
    basic: {
      badge: "Onboarding Checklist",
      title: "Complete Your Website",
      description: "Finish the remaining steps below to launch with confidence.",
    },
    standard: {
      badge: "Optimization Assistant",
      title: "Keep Your Site Momentum",
      description:
        "Monitor the workflows that keep your AI enhancements moving forward.",
    },
    premium: {
      badge: "Strategy Overview",
      title: "Your AI Team Is Running",
      description:
        "Everything is active. Review the highlights and plan your next moves.",
    },
  } as const;

  const showAiSeoBadge = effectivePlan === "standard" && seoDone;
  const progressLabel =
    effectivePlan === "premium" ? "Active Programs" : "Progress";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {headerCopy[effectivePlan].badge}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-gray-900">
            {headerCopy[effectivePlan].title}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {headerCopy[effectivePlan].description}
          </p>
          {showAiSeoBadge && (
            <span className="mt-3 inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
              AI SEO active
            </span>
          )}
        </div>

        <div className="sm:text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {progressLabel}
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{progress}%</p>
          <p className="text-xs text-gray-400">
            {effectivePlan === "premium"
              ? `${completedSteps} of ${totalSteps} milestones active`
              : `${completedSteps} of ${totalSteps} steps complete`}
          </p>
        </div>
      </div>

      <div className="mt-6 h-2 w-full rounded-full bg-gray-100">
        <div
          className="h-2 rounded-full bg-blue-600 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* steps list */}
      {effectivePlan === "premium" ? (
        <ul className="mt-6 space-y-3">
          {premiumSummary.map((item) => (
            <li
              key={item}
              className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-800"
            >
              <FontAwesomeIcon icon={faCircleCheck} className="text-green-500" />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-6 space-y-3">
          {steps.map((step) => (
            <li
              key={step.id}
              className="flex flex-col rounded-lg border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                {step.completed ? (
                  <FontAwesomeIcon icon={faCircleCheck} className="text-green-500" />
                ) : (
                  <FontAwesomeIcon icon={faEmptyCircle} className="text-gray-400" />
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
              </div>

              {!step.completed && (
                <Link
                  href={step.href}
                  className="mt-3 inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-500 sm:mt-0"
                >
                  Start →
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
