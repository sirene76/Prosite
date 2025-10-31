import type { ReactNode } from "react";
import "@/styles/new-builder.css";

import BuilderLayoutClient from "./BuilderLayoutClient";

type BuilderLayoutProps = {
  children: ReactNode;
  params: Promise<{ websiteId: string }>;
};

export default async function BuilderLayout({
  children,
  params,
}: BuilderLayoutProps) {
  const { websiteId } = await params;

  return (
    <BuilderLayoutClient websiteId={websiteId}>{children}</BuilderLayoutClient>
  );
}
