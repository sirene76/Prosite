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
