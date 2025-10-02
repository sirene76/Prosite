import { redirect } from "next/navigation";

export default async function BuilderCheckoutRedirect({ params }: { params: Promise<{ websiteId: string }> }) {
  const { websiteId } = await params;
  redirect(`/checkout/${websiteId}`);
}
