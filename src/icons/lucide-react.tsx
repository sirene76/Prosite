import { forwardRef } from "react";
import type { ReactNode, SVGProps } from "react";

export type LucideProps = SVGProps<SVGSVGElement> & {
  color?: string;
  size?: string | number;
  strokeWidth?: string | number;
};

const joinClassNames = (...classes: Array<string | undefined>) =>
  classes.filter(Boolean).join(" ") || undefined;

const createLucideIcon = (iconName: string, children: ReactNode) => {
  const Icon = forwardRef<SVGSVGElement, LucideProps>(
    (
      { color = "currentColor", size = 24, strokeWidth = 2, className, ...rest },
      ref
    ) => (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={joinClassNames("lucide", `lucide-${iconName}`, className)}
        {...rest}
      >
        {children}
      </svg>
    )
  );

  Icon.displayName = `Lucide${iconName.charAt(0).toUpperCase()}${iconName.slice(1)}`;

  return Icon;
};

export const Monitor = createLucideIcon(
  "monitor",
  <>
    <rect width="20" height="14" x="2" y="3" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </>
);

export const Tablet = createLucideIcon(
  "tablet",
  <>
    <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </>
);

export const Smartphone = createLucideIcon(
  "smartphone",
  <>
    <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </>
);

export const CheckCircle2 = createLucideIcon(
  "check-circle-2",
  <>
    <path d="M12 22a10 10 0 1 1 10-10 10 10 0 0 1-10 10" />
    <path d="m9 12 2 2 4-4" />
  </>
);

export const Clock3 = createLucideIcon(
  "clock-3",
  <>
    <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0" />
    <path d="M12 7v5h5" />
  </>
);
