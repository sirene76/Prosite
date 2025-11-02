import { CheckoutClient } from "./CheckoutClient";
import Website, { WebsiteDocument } from "@/models/Website";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = await params;

  await connectDB();
  const website = (await Website.findById(websiteId).lean()) as
  | (WebsiteDocument & { _id: string })
  | null;


  if (!website) return notFound();

  return (
    <CheckoutClient
      websiteId={websiteId}
      websiteName={website.name || "Untitled Website"}
      templateName={website.templateId || "Default Template"}
      themeName={website.theme?.label || website.theme?.name || "Default Theme"}
      businessName={website.content?.businessName || "Your Business"}
    />
  );
}
