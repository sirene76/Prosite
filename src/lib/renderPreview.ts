import { renderTemplate } from "@/lib/renderTemplate";
import { normaliseTemplateFields } from "@/lib/templateFieldUtils";
import type { TemplateMeta } from "@/types/template";

type TemplateLike = {
  html: string;
  css: string;
  js?: string;
  meta?: TemplateMeta;
  basePath?: string; // where assets live (e.g., /templates/<folder>)
};

/**
 * Returns a complete HTML document string suitable for <iframe srcDoc={...} />
 * - Injects rendered HTML (placeholders via renderTemplate)
 * - Inlines CSS
 * - Appends JS so it executes inside iframe
 * - Rewrites relative asset URLs if a basePath exists
 */
export function renderPreview(template: TemplateLike) {
  const defaultValues = template.meta?.fields
    ? normaliseTemplateFields(template.meta.fields).reduce<Record<string, string>>(
        (acc, field) => {
          const id = field.id?.trim();
          if (!id) {
            return acc;
          }
          if (typeof field.default === "string") {
            acc[id] = field.default;
          }
          return acc;
        },
        {}
      )
    : {};

  // Optionally rewrite relative asset URLs (src/href) to use basePath
  // Basic, safe replacement to keep this lightweight:
  const rewriteAssets = (html: string) => {
    if (!template.basePath) return html;
    return html
      .replaceAll('src="./', `src="${template.basePath}/`)
      .replaceAll("src='./", `src='${template.basePath}/`)
      .replaceAll('href="./', `href="${template.basePath}/`)
      .replaceAll("href='./", `href='${template.basePath}/`);
  };

  const renderedHtml = renderTemplate({
    html: rewriteAssets(template.html),
    values: defaultValues,
    modules: template.meta?.modules || [],
  });

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>${template.css}</style>
  </head>
  <body>
    ${renderedHtml}
    <script>${template.js || ""}</script>
  </body>
</html>
  `.trim();
}
