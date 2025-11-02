"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { faCircle } from "@fortawesome/free-regular-svg-icons";

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
  plan: "basic" | "standard" | "premium";
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
        label: "Enhance content quality",
        description: "Refine your copy with AI-assisted suggestions in the editor.",
      };
    }

    if (step.id === "seo") {
      return {
        ...step,
        label: "Optimize SEO automatically",
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
      : steps.filter((step) => step.completed).length;
  const progress =
    effectivePlan === "premium"
      ? 100
      : Math.round((completedSteps / totalSteps) * 100);

  const headerCopy: Record<
    typeof effectivePlan,
    { badge: string; title: string; description: string }
  > = {
    basic: {
      badge: "Onboarding Checklist",
      title: "Complete your website",
      description: "Finish the remaining steps below to launch with confidence.",
    },
    standard: {
      badge: "Optimization Assistant",
      title: "Keep your site momentum",
      description:
        "Monitor the workflows that keep your AI enhancements moving forward.",
    },
    premium: {
      badge: "Strategy Overview",
      title: "Your AI team is running",
      description:
        "Everything is active. Review the highlights and plan your next moves.",
    },
  };

  const showAiSeoBadge = effectivePlan === "standard" && seoDone;

  const progressLabel =
    effectivePlan === "premium" ? "Active programs" : "Progress";

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
          aria-hidden="true"
        />
      </div>

      {effectivePlan === "premium" ? (
        <div className="mt-6 space-y-4">
          <ul className="space-y-3">
            {premiumSummary.map((item) => (
              <li
                key={item}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-800"
              >
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-gray-500">
            Your AI SEO agent and content strategy are active. Check analytics for
            performance updates.
          </p>
        </div>
      ) : (
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
                  <FontAwesomeIcon
                    icon={step.completed ? faCircleCheck : faCircle}
                    className="h-5 w-5"
                  />
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
      )}
    </div>
  );
}
