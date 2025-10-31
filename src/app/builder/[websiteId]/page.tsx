import BuilderPageClient from "./BuilderPageClient";

export default async function BuilderPage({ params }: { params: Promise<{ websiteId: string }> }) {
  const { websiteId } = await params; // ✅ unwrap safely on the server
  return <BuilderPageClient websiteId={websiteId} />;
}
