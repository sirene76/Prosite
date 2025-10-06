import Image from "next/image";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import StartCustomizationForm from "@/components/ui/StartCustomizationForm";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { getTemplateById, getTemplates } from "@/lib/templates";
import { Website } from "@/models/website";

export async function generateStaticParams() {
  const templates = await getTemplates();
  return templates.map((template) => ({ templateId: template.id }));
}

type TemplateDetailsPageProps = {
  params: Promise<{ templateId: string }>;
};

export default async function TemplateDetailsPage({ params }: TemplateDetailsPageProps) {
  const { templateId } = await params;
  const template = await getTemplateById(templateId);

  if (!template) {
    notFound();
  }

  const startCustomizing = async () => {
    "use server";

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      const callbackUrl = encodeURIComponent(`/templates/${template.id}`);
      redirect(`/api/auth/signin?callbackUrl=${callbackUrl}`);
    }

    await connectDB();

    const sessionWithId = session as typeof session & { userId?: string };

    const website = await Website.create({
      name: template.name,
      templateId: template.id,
      userId: sessionWithId.userId,
      user: session.user.email,
      status: "draft",
      plan: "free",
      theme: {
        colors: {
          primary: "#3B82F6",
          secondary: "#10B981",
          background: "#FFFFFF",
          text: "#1F2937",
        },
        fonts: {},
      },
    });

    const websiteId = website._id?.toString?.();

    if (!websiteId) {
      throw new Error("Unable to start customizing: missing website id");
    }

    redirect(`/builder/${websiteId}/theme`);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-6 py-12">
      <div className="space-y-3 text-center">
        <h1 className="text-4xl font-semibold text-white">{template.name}</h1>
        {template.category ? (
          <span className="text-sm uppercase tracking-[0.25em] text-blue-400">{template.category}</span>
        ) : null}
        <p className="mx-auto max-w-2xl text-slate-300">{template.description}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/60">
        {template.previewVideo ? (
          <video
            src={template.previewVideo}
            controls
            playsInline
            poster={template.previewImage}
            className="h-[480px] w-full object-cover"
          />
        ) : (
          <div className="relative h-[480px] w-full">
            <Image
              src={template.previewImage}
              alt={template.name}
              fill
              sizes="(min-width: 1280px) 960px, (min-width: 768px) 720px, 100vw"
              className="object-cover"
              priority
            />
          </div>
        )}
      </div>

      {template.previewImages?.length ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {template.previewImages.map((image, index) => (
            <div
              key={`${image}-${index}`}
              className="relative aspect-[4/3] overflow-hidden rounded-lg border border-gray-800"
            >
              <Image
                src={image}
                alt={`Preview ${index + 1}`}
                fill
                sizes="(min-width: 1024px) 320px, (min-width: 768px) 240px, 50vw"
                className="object-cover"
                priority={index === 0}
              />
            </div>
          ))}
        </div>
      ) : null}

      {template.features?.length ? (
        <ul className="grid gap-2 text-slate-300 sm:grid-cols-2 md:grid-cols-3">
          {template.features.map((feature, index) => (
            <li key={`${feature}-${index}`} className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex justify-center pt-8">
        <StartCustomizationForm startCustomizing={startCustomizing} />
      </div>
    </div>
  );
}
