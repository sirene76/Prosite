import { TemplateSelection } from "@/components/builder/TemplateSelection";

type TemplateSelectionPageProps = {
  searchParams: Promise<{
    template?: string | string[];
  }>;
};

export default async function TemplateSelectionPage({ searchParams }: TemplateSelectionPageProps) {
  const params = await searchParams;
  const templateParam = params?.template;
  const initialTemplateId = Array.isArray(templateParam) ? templateParam[0] : templateParam;

  return (
    <div className="space-y-10 p-6">
      <TemplateSelection initialTemplateId={initialTemplateId} />
    </div>
  );
}
