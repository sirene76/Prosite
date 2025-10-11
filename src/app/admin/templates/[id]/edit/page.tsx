import TemplateEditorForm from "@/components/admin/TemplateEditorForm";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // ✅ Await params per Next.js 15 requirement
  const resolvedParams = await params;
  const templateId = resolvedParams?.id;

  if (!templateId) {
    throw new Error("Missing template ID in route parameters.");
  }

  // ✅ Fetch template data
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/templates/${templateId}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch template details.");
  }

  const template = await response.json();

  return (
    <div className="p-8">
      <TemplateEditorForm initialData={template} isEdit />
    </div>
  );
}
