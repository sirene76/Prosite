import { notFound } from "next/navigation";
import { CheckoutClient } from "./CheckoutClient";
import { connectDB } from "@/lib/mongodb";
import { Website } from "@/models/website";
import { getTemplateById } from "@/lib/templates";

const FALLBACK_IMAGE = "/placeholder-template.svg";

type CheckoutPageProps = {
  params: { websiteId: string };
  searchParams?: { canceled?: string };
};

async function loadWebsite(websiteId: string) {
  try {
    await connectDB();
  } catch (error) {
    console.error("Failed to connect to database while loading checkout page", error);
    return null;
  }

  const website = await Website.findById(websiteId).lean<{
    name?: string;
    templateId?: string;
    theme?: { name?: string; label?: string };
    previewImage?: string;
    thumbnailUrl?: string;
  }>();

  if (!website) {
    return null;
  }

  const template = website.templateId ? await getTemplateById(website.templateId) : null;

  return {
    name: website.name ?? "Untitled Website",
    templateName: template?.name ?? "Custom",
    themeName: website.theme?.name ?? website.theme?.label ?? "Default",
    previewImage: website.previewImage || website.thumbnailUrl || template?.previewImage || FALLBACK_IMAGE,
  };
}

export default async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
  const details = await loadWebsite(params.websiteId);

  if (!details) {
    notFound();
  }

  const initialError = searchParams?.canceled ? "Checkout canceled. You can try again when you're ready." : null;

  return (
    <main className="min-h-screen bg-slate-950 pb-16 pt-20 text-white">
      <div className="mx-auto w-full max-w-6xl px-6">
        <CheckoutClient
          websiteId={params.websiteId}
          websiteName={details.name}
          templateName={details.templateName}
          themeName={details.themeName}
          previewImage={details.previewImage}
          initialError={initialError}
        />
      </div>
    </main>
  );
}
