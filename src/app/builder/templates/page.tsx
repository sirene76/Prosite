import { TemplateSelection } from "@/components/builder/TemplateSelection";

type TemplateSelectionPageProps = {
  searchParams?: {
    template?: string | string[];
  };
};

export default function TemplateSelectionPage({ searchParams }: TemplateSelectionPageProps) {
  const templateParam = searchParams?.template;
  const initialTemplateId = Array.isArray(templateParam) ? templateParam[0] : templateParam;

  return (
    <div className="space-y-10 p-6">
      <TemplateSelection initialTemplateId={initialTemplateId} />
    </div>
  );
}
