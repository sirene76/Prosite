import { getTemplateAssets, getTemplateById } from "@/lib/templates";
import TemplateNotFound from "./not-found";

type TemplatePageProps = {
  params: { templateId: string };
};

export default async function TemplatePage({ params }: TemplatePageProps) {
  try {
    const template = await getTemplateById(params.templateId);

    if (!template) {
      return <TemplateNotFound />;
    }

    let html = template.html ?? "";
    let css = template.css ?? "";

    if (!html) {
      try {
        const assets = await getTemplateAssets(template.id);
        html = assets.html;
        css = assets.css;
      } catch (error) {
        console.error(`Failed to load template assets for ${template.id}`, error);
      }
    }

    return (
      <main className="min-h-screen bg-white text-black">
        <style dangerouslySetInnerHTML={{ __html: css ?? "" }} />
        <div dangerouslySetInnerHTML={{ __html: html ?? "" }} />
      </main>
    );
  } catch (error) {
    console.error("Template load error:", error);
    return <TemplateNotFound />;
  }
}
