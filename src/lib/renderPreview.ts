import { renderTemplate } from "@/lib/renderTemplate";
import { ensureTemplateFieldIds, normaliseTemplateFields } from "@/lib/templateFieldUtils";
import type { TemplateMeta } from "@/types/template";

type TemplateLike = {
  html?: string;
  css?: string;
  js?: string;
  htmlUrl?: string | null;
  cssUrl?: string | null;
  jsUrl?: string | null;
  meta?: TemplateMeta;
  assetBase?: string | null;
};

/**
 * Returns a complete HTML document string suitable for <iframe srcDoc={...} />
 * - Injects rendered HTML (placeholders via renderTemplate)
 * - Inlines CSS
 * - Appends JS so it executes inside iframe
 * - Rewrites relative asset URLs to point at remote UploadThing assets when available
 */
export async function renderPreview(template: TemplateLike) {
  const fieldsSource = template.meta?.fields
    ? ensureTemplateFieldIds(template.meta.fields)
    : undefined;

  if (template.meta && fieldsSource) {
    template.meta.fields = fieldsSource;
  }

  const defaultValues = fieldsSource
    ? normaliseTemplateFields(fieldsSource).reduce<Record<string, string>>(
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

  const assetBase =
    template.assetBase ??
    deriveAssetBase(
      [template.htmlUrl, template.cssUrl, template.jsUrl].find(isRemoteUrl) ?? null,
    );

  const html = await resolveTemplateAsset(template.htmlUrl, template.html);
  const css = await resolveTemplateAsset(template.cssUrl, template.css);
  const js = await resolveTemplateAsset(template.jsUrl, template.js);

  const rewrittenHtml = rewriteDocumentAssets(html, assetBase);
  const rewrittenCss = rewriteCssAssets(css, assetBase);

  const renderedHtml = renderTemplate({
    html: rewrittenHtml,
    values: defaultValues,
    modules: template.meta?.modules || [],
  });

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>${rewrittenCss}</style>
  </head>
  <body>
    ${renderedHtml}
    <script>${js}</script>
  </body>
</html>
  `.trim();
}

async function resolveTemplateAsset(
  remoteUrl: string | null | undefined,
  inlineValue: string | undefined,
) {
  if (!remoteUrl || !isRemoteUrl(remoteUrl)) {
    if (inlineValue && inlineValue.trim()) {
      return inlineValue;
    }
    return "";
  }

  try {
    const response = await fetch(remoteUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch template asset from ${remoteUrl}`);
    }
    return await response.text();
  } catch (error) {
    console.error(error);
    if (inlineValue && inlineValue.trim()) {
      return inlineValue;
    }
    return "";
  }
}

function deriveAssetBase(url: string | null | undefined) {
  if (!url) return null;

  try {
    const [cleaned] = url.split("?");
    if (!cleaned) return null;
    const lastSlash = cleaned.lastIndexOf("/");
    if (lastSlash === -1) {
      return ensureTrailingSlash(cleaned);
    }
    return ensureTrailingSlash(cleaned.slice(0, lastSlash + 1));
  } catch (error) {
    console.error("Failed to derive asset base", error);
    return null;
  }
}

function ensureTrailingSlash(value: string) {
  return value.endsWith("/") ? value : `${value}/`;
}

function isRemoteUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  if (url.startsWith("/")) return false;
  return /^https?:\/\//i.test(url);
}

function rewriteDocumentAssets(html: string, assetBase: string | null | undefined) {
  if (!html) return "";
  if (!assetBase) return html;

  const base = ensureTrailingSlash(assetBase);
  const output = html
    .replace(/(src|href)=\"\.\/(.*?)\"/g, (_match, attr: string, path: string) => {
      return `${attr}="${base}${path}"`;
    })
    .replace(/(src|href)=\'\.\/(.*?)\'/g, (_match, attr: string, path: string) => {
      return `${attr}='${base}${path}'`;
    });

  return output;
}

function rewriteCssAssets(css: string, assetBase: string | null | undefined) {
  if (!css) return "";
  if (!assetBase) return css;

  const base = ensureTrailingSlash(assetBase);
  const output = css
    .replace(/url\(\s*"\.\/(.*?)"\s*\)/g, (_match, path: string) => {
      return `url("${base}${path}")`;
    })
    .replace(/url\(\s*'\.\/(.*?)'\s*\)/g, (_match, path: string) => {
      return `url('${base}${path}')`;
    })
    .replace(/url\(\s*\.\/(.*?)\s*\)/g, (_match, path: string) => {
      return `url(${base}${path})`;
    });

  return output;
}
