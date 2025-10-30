import { redirect } from "next/navigation";

type BuilderWebsitePageProps = {
  params: Promise<{
    websiteId: string;
  }>;
};

export default async function BuilderWebsitePage({ params }: BuilderWebsitePageProps) {
  const { websiteId } = await params;
  if (!websiteId) {
    redirect("/builder");
  }

  redirect(`/builder/${websiteId}/branding`);
}
