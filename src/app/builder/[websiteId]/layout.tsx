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
  const { websiteId } = use(params);
  const pathname = usePathname();
  const isBuilderRoute = Boolean(pathname?.startsWith("/builder/"));

  useEffect(() => {
    if (!isBuilderRoute) {
      document.body.classList.remove("branding-builder-active");
      return;
    }

    document.body.classList.add("branding-builder-active");
    return () => {
      document.body.classList.remove("branding-builder-active");
    };
  }, [isBuilderRoute]);

  return (
    <BuilderLayoutClient websiteId={websiteId}>{children}</BuilderLayoutClient>
  );
}
