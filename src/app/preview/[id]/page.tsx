import { connectDB } from "@/lib/mongodb";
import { Template } from "@/models/template";

interface TemplatePreviewPageProps {
  params: { id: string };
  searchParams: Record<string, string | string[] | undefined>;
}

function getQueryParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

async function fetchText(url?: string) {
  if (!url) return "";
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch resource: ${url}`);
  }
  return response.text();
}

async function fetchJson<T>(url?: string): Promise<T | null> {
  if (!url) return null;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch resource: ${url}`);
  }
  return (await response.json()) as T;
}

export default async function TemplatePreviewPage({
  params,
  searchParams,
}: TemplatePreviewPageProps) {
  await connectDB();
  const { id } = params;
  const versionParam = getQueryParam(searchParams.version);
  const tokenParam = getQueryParam(searchParams.token);

  const template = await Template.findById(id).lean();
  if (!template) return <div>Template not found.</div>;

  const version = template.versions?.find((v: { number: string }) => v.number === versionParam);
  if (!version || version.previewToken !== tokenParam) {
    return <div>Invalid or expired preview link.</div>;
  }

  try {
    const [html, css, meta] = await Promise.all([
      fetchText(version.htmlUrl),
      fetchText(version.cssUrl),
      fetchJson<Record<string, unknown>>(version.metaUrl),
    ]);

    const title =
      (meta && typeof meta["title"] === "string"
        ? (meta["title"] as string)
        : meta && typeof meta["name"] === "string"
          ? (meta["name"] as string)
          : null) ?? template.name;

    const rendered = `
  <html>
    <head><style>${css}</style></head>
    <body>${html}</body>
  </html>
  `;

    return (
      <main className="w-full h-screen bg-gray-100 flex flex-col items-center justify-center">
        <h1 className="text-lg font-medium mb-3">Previewing {title} (v{version.number})</h1>
        <iframe
          srcDoc={rendered}
          sandbox="allow-scripts allow-same-origin"
          className="w-[1200px] h-[700px] border shadow-lg rounded-lg bg-white"
          title={`Preview of ${title}`}
        />
      </main>
    );
  } catch (error) {
    console.error("Failed to render preview", error);
    return <div>Failed to load preview resources.</div>;
  }
}
