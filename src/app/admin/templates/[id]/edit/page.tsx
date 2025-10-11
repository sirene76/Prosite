import TemplateEditorForm from "@/components/admin/TemplateEditorForm";

type EditTemplatePageProps = {
  params: { id: string };
};

const fallbackBaseUrl = "http://localhost:3000";

function getBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL;
  if (!fromEnv) {
    return fallbackBaseUrl;
  }

  return fromEnv.startsWith("http") ? fromEnv : `https://${fromEnv}`;
}

export default async function EditTemplatePage({ params }: EditTemplatePageProps) {
  const response = await fetch(`${getBaseUrl()}/api/admin/templates/${params.id}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch template");
  }

  const template = await response.json();

  return (
    <div className="p-8">
      <TemplateEditorForm initialData={template} isEdit />
    </div>
  );
}
