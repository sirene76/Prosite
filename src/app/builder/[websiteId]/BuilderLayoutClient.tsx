"use client";

import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import NewBuilderShell, {
  type BuilderShellRenderProps,
  type BuilderStep,
} from "@/components/NewBuilderShell";

const BUILDER_STEPS: BuilderStep[] = [
  { id: "template", label: "Template" },
  { id: "branding", label: "Branding" },
  { id: "checkout", label: "Checkout" },
];

type BuilderLayoutClientProps = {
  websiteId: string;
  children: ReactNode;
};

type BuilderPageChildProps = {
  builderShell?: BuilderShellRenderProps;
  activeStep?: string;
  steps?: BuilderStep[];
  onStepChange?: (stepId: string) => void;
};

export default function BuilderLayoutClient({
  websiteId,
  children,
}: BuilderLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isBrandingRoute = Boolean(pathname?.includes("/branding"));

  useEffect(() => {
    if (!isBrandingRoute) {
      return;
    }

    document.body.classList.add("branding-builder-active");
    return () => {
      document.body.classList.remove("branding-builder-active");
    };
  }, [isBrandingRoute]);

  const stepRoutes = useMemo(
    () => ({
      template: `/builder/${websiteId}`,
      branding: `/builder/${websiteId}/branding`,
      checkout: `/builder/${websiteId}/checkout`,
    }),
    [websiteId],
  );

  const handleStepChange = (stepId: string) => {
    const targetRoute = stepRoutes[stepId as keyof typeof stepRoutes];
    if (!targetRoute || targetRoute === pathname) {
      return;
    }
    router.push(targetRoute);
  };

  if (!isBrandingRoute || !isValidElement(children)) {
    return <>{children}</>;
  }

  return (
    <NewBuilderShell
      steps={BUILDER_STEPS}
      activeStep="branding"
      onStepChange={handleStepChange}
    >
      {(shellProps) =>
        cloneElement(children as ReactElement<BuilderPageChildProps>, {
          builderShell: shellProps,
          activeStep: "branding",
          steps: BUILDER_STEPS,
          onStepChange: handleStepChange,
        })
      }
    </NewBuilderShell>
  );
}
