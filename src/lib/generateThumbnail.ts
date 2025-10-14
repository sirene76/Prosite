import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

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

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
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
    await page.screenshot({ path: previewPath, type: "png", fullPage: true });
    await browser.close();

    console.log(`✅ Thumbnail generated for ${id}`);
    return `/templates/${id}/preview.png`;
  } catch (err) {
    console.error("Thumbnail generation failed:", err);
    return null;
  }
}
