import * as cheerio from "cheerio";

import { recordAnalytics } from "@/lib/analyticsTracker";

export type SEOScanResult = {
  score: number;
  suggestions: string[];
};

const FALLBACK_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Prosite Placeholder</title>
  </head>
  <body>
    <main>
      <h1>Your site is not live yet</h1>
      <p>Launch your project to unlock full SEO insights.</p>
      <img src="placeholder.jpg" />
    </main>
  </body>
</html>`;

function clampScore(value: number) {
  if (value < 0) {
    return 0;
  }
  if (value > 100) {
    return 100;
  }
  return Math.round(value);
}

function uniqueSuggestions(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export async function scanSEO(
  websiteUrl: string | undefined | null,
  siteId?: string
): Promise<SEOScanResult> {
  let html = "";
  let siteUnreachable = false;

  if (websiteUrl) {
    try {
      const response = await fetch(websiteUrl, {
        cache: "no-store",
      });
      if (response.ok) {
        html = await response.text();
      } else {
        siteUnreachable = true;
      }
    } catch (error) {
      console.warn("SEO scan fetch failed", error);
      siteUnreachable = true;
    }
  }

  if (!html) {
    html = FALLBACK_HTML;
  }

  const $ = cheerio.load(html);
  const suggestions: string[] = [];

  if (siteUnreachable) {
    suggestions.push("Site could not be reached. Verify the deployment URL is live.");
  }

  const titleText = $("title").text().trim();
  const hasTitle = titleText.length > 0;
  if (!hasTitle) {
    suggestions.push("Add a descriptive <title> tag");
  }

  const metaDescription = $('meta[name="description"]').attr("content");
  if (!metaDescription || metaDescription.trim().length < 50) {
    suggestions.push("Include a compelling meta description of at least 50 characters");
  }

  const metaCount = $("meta").length;
  if (metaCount < 3) {
    suggestions.push("Add more meta tags for SEO and social previews");
  }

  const h1Count = $("h1").length;
  if (h1Count === 0) {
    suggestions.push("Add at least one <h1> headline to describe the page");
  } else if (h1Count > 1) {
    suggestions.push("Use a single <h1> tag to maintain a clear hierarchy");
  }

  const imageCount = $("img").length;
  const imageAltCount = $("img[alt]").length;
  if (imageCount > 0) {
    const ratio = imageAltCount / imageCount;
    if (ratio < 0.8) {
      suggestions.push("Ensure most images include descriptive alt text");
    }
  } else {
    suggestions.push("Add imagery to enrich your content");
  }

  const linkCount = $("a").length;
  if (linkCount === 0) {
    suggestions.push("Add internal or external links to improve navigation");
  }

  let score = 100;
  if (!hasTitle) {
    score -= 20;
  }
  if (!metaDescription || metaDescription.trim().length < 50) {
    score -= 15;
  }
  if (metaCount < 3) {
    score -= 10;
  }
  if (h1Count === 0) {
    score -= 10;
  } else if (h1Count > 1) {
    score -= 5;
  }
  if (imageCount === 0) {
    score -= 10;
  } else if (imageCount > 0) {
    const ratio = imageAltCount / Math.max(1, imageCount);
    if (ratio < 0.8) {
      score -= 10;
    }
  }
  if (linkCount === 0) {
    score -= 5;
  }

  const finalSuggestions = uniqueSuggestions(suggestions);
  const finalScore = clampScore(score);

  const result: SEOScanResult = {
    score: finalScore,
    suggestions: finalSuggestions.length
      ? finalSuggestions
      : ["Great job! Your core SEO signals look strong."],
  };

  if (siteId) {
    await recordAnalytics(siteId, { seoScore: result.score });
  }

  return result;
}
