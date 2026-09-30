/**
 * Build lightweight WebP thumbs for homepage category art + marquee cards.
 * Run: node scripts/assets/generate-category-thumbs.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ESSENTIAL_STATIC_IMAGE_PATHS } from "./essential-static-paths.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PUBLIC = path.join(ROOT, "public");
const CAT_DIR = path.join(PUBLIC, "images/m/home/cats");
const CAT_THUMB_DIR = path.join(CAT_DIR, "thumbs");
const PRODUCT_THUMB_DIR = path.join(PUBLIC, "images/m/products/thumbs");

const CATEGORY_NAMES = ESSENTIAL_STATIC_IMAGE_PATHS.filter((p) => p.includes("/m/home/cats/"))
  .map((p) => path.basename(p))
  .filter((name) => !name.endsWith(".webp"));

async function writeWebp(sharp, inputPath, outputPath, width = 160) {
  if (!fs.existsSync(inputPath)) return false;
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const stat = fs.existsSync(outputPath) ? fs.statSync(outputPath) : null;
  const sourceStat = fs.statSync(inputPath);
  if (stat && stat.mtimeMs >= sourceStat.mtimeMs && stat.size > 256) {
    return true;
  }
  await sharp(inputPath, { failOn: "none" })
    .rotate()
    .resize(width, width, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toFile(outputPath);
  return fs.existsSync(outputPath) && fs.statSync(outputPath).size > 256;
}

async function main() {
  const sharp = (await import("sharp")).default;
  let ok = 0;
  let failed = 0;

  for (const filename of CATEGORY_NAMES) {
    const base = filename.replace(/\.(png|jpe?g)$/i, "");
    const inputPath = path.join(CAT_DIR, filename);
    const catThumbPath = path.join(CAT_THUMB_DIR, `${base}.webp`);
    const productThumbPath = path.join(PRODUCT_THUMB_DIR, `${base}.webp`);

    try {
      if (await writeWebp(sharp, inputPath, catThumbPath, 160)) ok++;
      else failed++;
      if (await writeWebp(sharp, inputPath, productThumbPath, 96)) ok++;
      else failed++;
    } catch (error) {
      failed++;
      console.warn(`WARN: ${filename}: ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log(`Category thumbs generated. OK=${ok} failed=${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
