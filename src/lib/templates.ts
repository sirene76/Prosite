export type TemplateDefinition = {
  id: string;
  name: string;
  description: string;
  category: string;
  pages: string[];
  swatches: string[];
  htmlFile: string;
  cssFile: string;
};

export const templates: TemplateDefinition[] = [
  {
    id: "portfolio-creative",
    name: "Portfolio Creative",
    description: "Bold single-page portfolio ideal for designers and agencies.",
    category: "Creative Portfolio",
    pages: ["Home", "About", "Services", "Contact"],
    swatches: ["#38bdf8", "#0ea5e9", "#f472b6"],
    htmlFile: "index.html",
    cssFile: "style.css"
  }
];

export async function loadTemplateAssets(templateId: string) {
  const template = templates.find((entry) => entry.id === templateId);
  if (!template) {
    throw new Error(`Template with id "${templateId}" not found`);
  }

  if (typeof window !== "undefined") {
    throw new Error("loadTemplateAssets can only be used on the server");
  }

  const [fs, path] = await Promise.all([import("node:fs/promises"), import("node:path")]);
  const basePath = path.join(process.cwd(), "templates", templateId);

  const [html, css] = await Promise.all([
    fs.readFile(path.join(basePath, template.htmlFile), "utf-8"),
    fs.readFile(path.join(basePath, template.cssFile), "utf-8")
  ]);

  return { html, css };
}
