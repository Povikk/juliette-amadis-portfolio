import { readdir, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const pnpmRoot = path.join(root, "node_modules", ".pnpm");
const sharpFolder = (await readdir(pnpmRoot, { withFileTypes: true }))
  .find((entry) => entry.isDirectory() && entry.name.startsWith("sharp@"));
if (!sharpFolder) throw new Error("Sharp est introuvable. Lancez d’abord pnpm install.");
const sharpModule = path.join(pnpmRoot, sharpFolder.name, "node_modules", "sharp", "lib", "index.js");
const { default: sharp } = await import(pathToFileURL(sharpModule).href);

const sourceDir = path.join(root, "assets-source", "shop");
const shopDir = path.join(root, "public", "shop");
const thumbsDir = path.join(shopDir, "thumbs");
const detailsDir = path.join(shopDir, "detail");
await mkdir(thumbsDir, { recursive: true });
await mkdir(detailsDir, { recursive: true });

const files = (await readdir(sourceDir)).filter((name) => name.toLowerCase().endsWith(".webp"));
let sourceBytes = 0;
let thumbnailBytes = 0;
let detailBytes = 0;

for (const name of files) {
  const source = path.join(sourceDir, name);
  const thumbnail = path.join(thumbsDir, name);
  const detail = path.join(detailsDir, name);
  sourceBytes += (await stat(source)).size;

  await sharp(source)
    .rotate()
    .resize({ width: 560, height: 700, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 66, effort: 6, smartSubsample: true })
    .toFile(thumbnail);

  await sharp(source)
    .rotate()
    .resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 74, effort: 6, smartSubsample: true })
    .toFile(detail);
  thumbnailBytes += (await stat(thumbnail)).size;
  detailBytes += (await stat(detail)).size;
}

const ogPath = path.join(root, "assets-source", "branding", "og.png");
try {
  const optimizedOg = path.join(root, "public", "og-optimized.png");
  await sharp(ogPath).resize(1200, 630, { fit: "cover", position: "centre" }).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(optimizedOg);
} catch (error) {
  console.warn("L’image de partage n’a pas pu être optimisée :", error.message);
}

console.log(JSON.stringify({
  files: files.length,
  sourceMB: Number((sourceBytes / 1024 / 1024).toFixed(2)),
  thumbnailsMB: Number((thumbnailBytes / 1024 / 1024).toFixed(2)),
  detailsMB: Number((detailBytes / 1024 / 1024).toFixed(2)),
  averageThumbnailKB: Math.round(thumbnailBytes / files.length / 1024),
  averageDetailKB: Math.round(detailBytes / files.length / 1024),
}, null, 2));
