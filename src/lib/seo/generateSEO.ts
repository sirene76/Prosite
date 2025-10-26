import fs from "fs";
import path from "path";

import slugify from "@/lib/slugify";
import { Website } from "@/models/Website";

export async function generateSEO(websiteId: string) {
  const website = await Website.findById(websiteId);
  if (!website) throw new Error("Website not found");

  const {
    pages = [],
    title = "",
    description = "",
    type = "",
    name = "",
    previewImage,
    seo: existingSeo = {},
  } = (website.toObject?.() ?? website) as any;

  const siteTitle = title || name || "";
  const defaultDescription =
    description || "Your website powered by Prosite";
  const seoData: any = { ...existingSeo, pages: {} };

  // 1️⃣ Generate meta tags for each page
  for (const page of pages as any[]) {
    const normalized = normalizePage(page, siteTitle);
    const pageTitle =
      normalized.title ||
      `${siteTitle}${normalized.name ? ` | ${normalized.name}` : ""}`;
    const metaDescription =
      normalized.description || `Discover ${siteTitle} - ${defaultDescription}`;
    const keywords = extractKeywords(normalized.content || "");

    seoData.pages[normalized.slug] = {
      title: pageTitle,
      description: metaDescription,
      keywords,
      openGraph: {
        ogTitle: pageTitle,
        ogDescription: metaDescription,
        ogImage: previewImage || "/default-og.png",
      },
      twitter: {
        card: "summary_large_image",
        title: pageTitle,
        description: metaDescription,
        image: previewImage || "/default-og.png",
      },
    };
  }

  // 2️⃣ Schema.org data
  seoData.schema = generateSchema(
    type,
    siteTitle,
    defaultDescription,
    getWebsiteUrl(website)
  );

  // 3️⃣ Sitemap + robots.txt
  seoData.sitemap = generateSitemap(website);
  const websiteUrl = getWebsiteUrl(website);
  const sitemapUrl = websiteUrl ? `${websiteUrl}/sitemap.xml` : "/sitemap.xml";
  seoData.robots = `User-agent: *\nAllow: /\nSitemap: ${sitemapUrl}`;

  // 4️⃣ Save SEO data
  website.seo = seoData;
  await website.save();

  persistSeoAssets(websiteId, seoData);

  return seoData;
}

function normalizePage(page: any, fallbackTitle: string) {
  if (!page) {
    return {
      slug: "",
      title: fallbackTitle,
      description: "",
      content: "",
    };
  }

  if (typeof page === "string") {
    const slug = slugify(page, { lower: true });
    return {
      slug: slug || page,
      title: `${fallbackTitle}${page ? ` | ${page}` : ""}`,
      description: "",
      content: "",
      name: page,
    };
  }

  const slug =
    page.slug || slugify(page.name || page.title || "page", { lower: true });

  return {
    slug,
    title: page.title,
    description: page.description,
    content: page.content,
    name: page.name,
  };
}

function getWebsiteUrl(website: any) {
  const candidate =
    website?.url || website?.deployment?.url || website?.domain || "";
  if (!candidate || typeof candidate !== "string") return "";
  return candidate.replace(/\/$/, "");
}

function extractKeywords(text: string) {
  return [...new Set(text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [])]
    .slice(0, 10)
    .join(", ");
}

function generateSchema(
  type: string,
  name: string,
  desc: string,
  url: string
) {
  const base = {
    "@context": "https://schema.org",
    "@type": type || "WebSite",
    name,
    description: desc,
    url,
  } as Record<string, unknown>;

  if (type === "Restaurant")
    return { ...base, "@type": "Restaurant", servesCuisine: "International" };
  if (type === "Agency")
    return { ...base, "@type": "Organization", serviceType: "Web Design" };
  if (type === "Blog") return { ...base, "@type": "Blog", blogPost: [] };

  return base;
}

function generateSitemap(website: any) {
  const baseUrl = getWebsiteUrl(website);
  const pages = Array.isArray(website?.pages) ? website.pages : [];

  const urls = pages
    .map((page: any) => {
      const { slug } = normalizePage(page, "");
      if (!slug) {
        return "";
      }
      const loc = baseUrl
        ? `${baseUrl}/${slug.replace(/^\//, "")}`
        : `/${slug.replace(/^\//, "")}`;
      return `<url><loc>${loc}</loc></url>`;
    })
    .filter(Boolean)
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>\n  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}

function persistSeoAssets(websiteId: string, seoData: any) {
  try {
    const baseDir = path.join(process.cwd(), ".next-cache", "seo", websiteId);
    fs.mkdirSync(baseDir, { recursive: true });

    fs.writeFileSync(
      path.join(baseDir, "schema.json"),
      JSON.stringify(seoData.schema, null, 2)
    );
    fs.writeFileSync(path.join(baseDir, "sitemap.xml"), seoData.sitemap || "");
    fs.writeFileSync(path.join(baseDir, "robots.txt"), seoData.robots || "");
  } catch (error) {
    console.error("Failed to persist SEO assets", error);
  }
}
