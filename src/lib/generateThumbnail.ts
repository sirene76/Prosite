import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";
import sharp from "sharp";
import chromium from "@sparticuz/chromium";

type ThumbnailOptions = {
  id: string;
  html: string;
  css: string;
  js?: string;
};

export async function generateThumbnail({ id, html, css, js = "" }: ThumbnailOptions) {
  const extractDir = path.join(process.cwd(), "public", "templates", id);
  if (!fs.existsSync(extractDir)) fs.mkdirSync(extractDir, { recursive: true });

  const previewPath = path.join(extractDir, "preview.png");
  const fallbackPreviewPath = path.join(
    process.cwd(),
    "public",
    "templates",
    "default-template-preview.svg"
  );

  const ensurePreview = async () => {
    if (fs.existsSync(previewPath)) {
      return true;
    }

    if (!fs.existsSync(fallbackPreviewPath)) {
      return false;
    }

    try {
      const buffer = await sharp(fallbackPreviewPath).png().toBuffer();
      fs.writeFileSync(previewPath, buffer);
      return true;
    } catch (error) {
      console.error("❌ Failed to create fallback preview:", error);
      return false;
    }
  };

  try {
    // Launch headless Chromium compatible with both local & serverless
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true, // ✅ hardcode true instead of chromium.headless
    });

    const page = await browser.newPage();
    const renderHTML = `
      <html>
        <head><style>${css}</style></head>
        <body>${html}<script>${js}</script></body>
      </html>
    `;

    await page.setViewport({ width: 1280, height: 800 });
    await page.setContent(renderHTML, { waitUntil: "networkidle0" });

    // ✅ Ensure path literal ends with ".png" for TS inference
    await page.screenshot({
      path: previewPath as `${string}.png`,
      type: "png",
      fullPage: true,
    });

    await browser.close();

    await ensurePreview();

    console.log("✅ Thumbnail generated:", previewPath);
    return `/templates/${id}/preview.png`;
  } catch (err) {
    console.error("❌ Thumbnail generation failed:", err);
    if (await ensurePreview()) {
      return `/templates/${id}/preview.png`;
    }
    return null;
  }
}
