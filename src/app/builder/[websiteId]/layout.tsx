import type { ReactNode } from "react";
import "../../../styles/builder-dark.css";
import BuilderShell from "./BuilderShell";

interface BuilderLayoutProps {
  children: ReactNode;
  params: {
    websiteId: string;
  };
}

export default function BuilderLayout({ children, params }: BuilderLayoutProps) {
  return <BuilderShell websiteId={params.websiteId}>{children}</BuilderShell>;
}
