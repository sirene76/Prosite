export const BUILDER_STEPS = [
  "templates",
  "branding",
  "preview",
  "checkout",
] as const;

export type BuilderStep = (typeof BUILDER_STEPS)[number];

const STEP_LABEL_OVERRIDES: Partial<Record<BuilderStep, string>> = {
  templates: "template",
};

const BUILDER_STEP_SET = new Set<string>(BUILDER_STEPS as readonly string[]);

export function isBuilderStep(value: string | undefined): value is BuilderStep {
  return typeof value === "string" && BUILDER_STEP_SET.has(value);
}

export function getBuilderStepLabel(step: BuilderStep) {
  const override = STEP_LABEL_OVERRIDES[step] ?? step;
  return override
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function resolveBuilderBasePath(pathname: string | null | undefined) {
  if (!pathname) {
    return { basePath: "/builder", websiteId: undefined as string | undefined };
  }

  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] !== "builder") {
    return { basePath: "/builder", websiteId: undefined as string | undefined };
  }

  const maybeWebsiteId = segments[1];

  if (maybeWebsiteId) {
    if (maybeWebsiteId === "new") {
      return { basePath: "/builder/new", websiteId: undefined };
    }

    if (!isBuilderStep(maybeWebsiteId)) {
      return { basePath: `/builder/${maybeWebsiteId}`, websiteId: maybeWebsiteId };
    }
  }

  return { basePath: "/builder", websiteId: undefined as string | undefined };
}

export function buildBuilderStepPath(basePath: string, step: BuilderStep) {
  const normalizedBase = basePath && basePath !== "/builder" ? basePath.replace(/\/$/, "") : "/builder";
  if (normalizedBase === "/builder") {
    return `${normalizedBase}/${step}`;
  }
  return `${normalizedBase}/${step}`;
}

export function getActiveBuilderStep(pathname: string | null | undefined): BuilderStep | null {
  if (!pathname) {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean).reverse();

  for (const segment of segments) {
    if (isBuilderStep(segment)) {
      return segment;
    }
  }

  return null;
}
