import fs from "fs";
import path from "path";

type ThumbnailOptions = {
  id: string;
  html: string;
  css: string;
  js?: string;
};

type Viewport = {
  width: number;
  height: number;
};

type PageLike = {
  setViewport: (viewport: Viewport) => Promise<void>;
  setContent: (html: string, options: { waitUntil: "networkidle0" }) => Promise<void>;
  screenshot: (options: { path: string; type: "png"; fullPage: boolean }) => Promise<void>;
};

type BrowserLike = {
  newPage: () => Promise<PageLike>;
  close: () => Promise<void>;
};

type LaunchOptions = {
  headless?: boolean | "new";
  args?: string[];
  defaultViewport?: Viewport;
  executablePath?: string;
};

type PuppeteerModule = {
  launch: (options: LaunchOptions) => Promise<BrowserLike>;
};

type ChromiumModule = {
  args: string[];
  defaultViewport?: Viewport | null;
  executablePath: () => Promise<string>;
  headless?: boolean | "new";
};

function resolveDefault<T>(mod: T): unknown {
  return (mod as unknown as { default?: unknown }).default ?? mod;
}

async function launchBrowser() {
  const preferCore = process.env.USE_PUPPETEER_CORE === "true";

  if (!preferCore) {
    try {
      const puppeteerModule = (await import("puppeteer")) as unknown as PuppeteerModule & {
        default?: PuppeteerModule;
      };
      const puppeteer = resolveDefault(puppeteerModule) as PuppeteerModule;
      return await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    } catch (error) {
      console.warn("Falling back to puppeteer-core due to launch error:", error);
    }
  }

  try {
    const [puppeteerCoreModule, chromiumModule] = await Promise.all([
      import("puppeteer-core"),
      import("@sparticuz/chromium"),
    ]);

    const puppeteerCore = resolveDefault(puppeteerCoreModule) as PuppeteerModule;
    const chromium = resolveDefault(chromiumModule) as ChromiumModule;

    return await puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport ?? undefined,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless ?? true,
    });
  } catch (coreError) {
    console.error("Unable to launch Puppeteer using puppeteer-core.", coreError);
    throw coreError;
  }
}

export async function generateThumbnail({ id, html, css, js = "" }: ThumbnailOptions) {
  const extractDir = path.join(process.cwd(), "public", "templates", id);
  if (!fs.existsSync(extractDir)) fs.mkdirSync(extractDir, { recursive: true });

  const previewPath = path.join(extractDir, "preview.png");

  let browser: BrowserLike | null = null;

  try {
    browser = await launchBrowser();
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

    console.log(`✅ Thumbnail generated for ${id}`);
    return `/templates/${id}/preview.png`;
  } catch (err) {
    console.error("Thumbnail generation failed:", err);
    return null;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Failed to close Puppeteer browser instance:", closeError);
      }
    }
  }
}
