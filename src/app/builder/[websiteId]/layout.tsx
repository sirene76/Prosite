// import type { ReactNode } from "react";
// import "@/styles/builder-dark.css";
// 

// interface BuilderLayoutProps {
//   children: ReactNode;
//   params: Promise<{
//     websiteId: string;
//   }>;
// }

// export default async function BuilderLayout({
//   children,
//   params,
// }: BuilderLayoutProps) {
//   const { websiteId } = await params;

//   return <BuilderShell websiteId={websiteId}>{children}</BuilderShell>;
// }
import "@/styles/builder-dark.css";
import BuilderShell from "./BuilderShell";

export default async function BuilderLayout({ children, params }: any) {
  const { websiteId } = await params;
  return <BuilderShell websiteId={websiteId}>{children}</BuilderShell>;
}
