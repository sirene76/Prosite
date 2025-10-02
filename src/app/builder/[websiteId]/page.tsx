import { redirect } from "next/navigation";

type BuilderWebsitePageProps = {
  params: {
    websiteId?: string;
  };
};

export default function BuilderWebsitePage({ params }: BuilderWebsitePageProps) {
  const { websiteId } = params;

  if (!websiteId) {
    redirect("/builder/templates");
  }

  redirect(`/builder/${websiteId}/templates`);
}
