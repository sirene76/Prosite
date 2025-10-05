import fs from "fs";
import path from "path";
import chalk from "chalk";

type TemplateMeta = {
  id?: string;
  name?: string;
  fields?: Record<string, { type: string; label: string }> | undefined;
  colors?: Record<string, string> | undefined;
  preview?: string;
  previewImage?: string;
  video?: string;
};

const root = path.resolve("templates");

if (!fs.existsSync(root)) {
  console.error(chalk.red(`❌ templates directory not found at ${root}`));
  process.exit(1);
}

const entries = fs.readdirSync(root, { withFileTypes: true });
const folders = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);

if (!folders.length) {
  console.log(chalk.yellow("⚠️  No template folders found."));
  process.exit(0);
}

let hasErrors = false;

for (const folder of folders) {
  const templatePath = path.join(root, folder);
  const metaPath = path.join(templatePath, "meta.json");
  const htmlPath = path.join(templatePath, "index.html");

  const missingFiles: string[] = [];
  if (!fs.existsSync(metaPath)) missingFiles.push("meta.json");
  if (!fs.existsSync(htmlPath)) missingFiles.push("index.html");

  if (missingFiles.length) {
    hasErrors = true;
    console.log(chalk.red(`❌ ${folder}: Missing files -> ${missingFiles.join(", ")}`));
    continue;
  }

  let meta: TemplateMeta;
  try {
    const metaRaw = fs.readFileSync(metaPath, "utf8");
    meta = JSON.parse(metaRaw);
  } catch (error) {
    hasErrors = true;
    console.log(chalk.red(`❌ ${folder}: Unable to parse meta.json (${(error as Error).message})`));
    continue;
  }

  const requiredKeys: (keyof TemplateMeta)[] = ["id", "name", "fields", "colors"];
  const missingKeys = requiredKeys.filter((key) => meta[key] === undefined);
  if (missingKeys.length) {
    hasErrors = true;
    console.log(chalk.red(`❌ ${folder}: meta.json missing required keys -> ${missingKeys.join(", ")}`));
    continue;
  }

  if (typeof meta.fields !== "object" || meta.fields === null || Array.isArray(meta.fields)) {
    hasErrors = true;
    console.log(chalk.red(`❌ ${folder}: meta.json fields must be an object map`));
    continue;
  }

  if (typeof meta.colors !== "object" || meta.colors === null || Array.isArray(meta.colors)) {
    hasErrors = true;
    console.log(chalk.red(`❌ ${folder}: meta.json colors must be an object`));
    continue;
  }

  const html = fs.readFileSync(htmlPath, "utf8");
  const placeholders = Array.from(html.matchAll(/{{(.*?)}}/g)).map((match) => match[1].trim());
  const uniquePlaceholders = Array.from(new Set(placeholders)).filter((placeholder) => {
    return placeholder && !placeholder.startsWith("modules.");
  });
  const fieldKeys = Object.keys(meta.fields);

  const previewPath =
    typeof meta.preview === "string" && meta.preview.trim().length
      ? meta.preview.trim()
      : typeof meta.previewImage === "string" && meta.previewImage.trim().length
        ? meta.previewImage.trim()
        : undefined;

  if (previewPath) {
    const normalisedPreviewPath = previewPath.replace(/^\/+/, "");
    const absolutePreviewPath = path.join("public", normalisedPreviewPath);
    if (!fs.existsSync(absolutePreviewPath)) {
      console.log(
        chalk.yellow(
          `⚠️  ${folder}: Preview image not found at public/${normalisedPreviewPath} (defined as ${previewPath})`
        )
      );
    }
  } else {
    console.log(chalk.yellow(`⚠️  ${folder}: No preview image path defined in meta.json`));
  }

  const videoPath = typeof meta.video === "string" && meta.video.trim().length ? meta.video.trim() : undefined;
  if (videoPath) {
    const normalisedVideoPath = videoPath.replace(/^\/+/, "");
    const absoluteVideoPath = path.join("public", normalisedVideoPath);
    if (!fs.existsSync(absoluteVideoPath)) {
      console.log(
        chalk.yellow(`⚠️  ${folder}: Preview video not found at public/${normalisedVideoPath} (defined as ${videoPath})`)
      );
    }
  }

  const missingFields = uniquePlaceholders.filter((placeholder) => !fieldKeys.includes(placeholder));

  if (missingFields.length) {
    console.log(
      chalk.yellow(`⚠️  ${folder}: Missing fields in meta.json -> ${missingFields.join(", ")}`)
    );
  }

  if (!missingFields.length) {
    console.log(chalk.green(`✅ ${folder} validated successfully`));
  }
}

if (hasErrors) {
  process.exit(1);
}
