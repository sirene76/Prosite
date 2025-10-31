"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import "@/styles/new-builder.css";

import BuilderLayoutClient from "./BuilderLayoutClient";

type BuilderLayoutProps = {
  children: ReactNode;
  params: { websiteId: string };
};

export default function BuilderLayout({
  children,
  params,
}: BuilderLayoutProps) {
  const { websiteId } = params;
  const pathname = usePathname();
  const isBrandingRoute = Boolean(pathname?.includes("/branding"));

  useEffect(() => {
    if (!isBrandingRoute) {
      document.body.classList.remove("branding-builder-active");
      return;
    }

    document.body.classList.add("branding-builder-active");
    return () => {
      document.body.classList.remove("branding-builder-active");
    };
  }, [isBrandingRoute]);

  return (
    <BuilderLayoutClient websiteId={websiteId}>{children}</BuilderLayoutClient>
  );
}
