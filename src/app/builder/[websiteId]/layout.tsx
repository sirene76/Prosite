import "../../../styles/builder-dark.css";
import BuilderShell from "./BuilderShell";

export default async function BuilderLayout({
  children,
  params,
}: any) {
  const { websiteId } = await params;

  return <BuilderShell websiteId={websiteId}>{children}</BuilderShell>;
}
