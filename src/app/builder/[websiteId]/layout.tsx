<<<<<<< HEAD
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
=======
import "../../../styles/builder-dark.css";
import BuilderShell from "./BuilderShell";

export default async function BuilderLayout({
  children,
  params,
}: any) {
>>>>>>> 439034acf166a777599acc38a63a01f616d17777
  const { websiteId } = await params;
  return <BuilderShell websiteId={websiteId}>{children}</BuilderShell>;
}
