import "@/styles/new-builder.css";

export default async function BuilderLayout({ children, params }: any) {
  const { websiteId } = await params;
  return <>{children}</>;
}
