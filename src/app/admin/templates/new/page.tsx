import { TemplateForm } from "../_components/TemplateForm";

export default function NewTemplatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Add New Template</h2>
        <p className="text-sm text-slate-400">
          Provide template details, media, and publishing status. All fields can be updated later.
        </p>
      </div>

      <TemplateForm mode="create" />
    </div>
  );
}
