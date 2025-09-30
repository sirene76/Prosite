import type { ReactNode } from "react";
import BuilderRoot from "./BuilderRoot";

export default function BuilderLayout({ children }: { children: ReactNode }) {
  return <BuilderRoot>{children}</BuilderRoot>;
}
