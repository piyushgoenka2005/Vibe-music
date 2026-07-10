/**
 * Build square favicon assets for browsers and Google Search.
 * Run: npm run generate:favicons
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import toIco from "to-ico";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PUBLIC = path.join(ROOT, "public");
const APP = path.join(ROOT, "src/app");

const LOGO_CANDIDATES = [
  path.join(PUBLIC, "images/FINAL LOGO VIBE MUSIC GUITAR 2.png"),
  path.join(PUBLIC, "logo.jpeg"),
];

const SQUARE_BACKGROUND = { r: 255, g: 255, b: 255, alpha: 1 };

function resolveLogoSource() {
  for (const candidate of LOGO_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(
    "Missing logo source. Expected public/images/FINAL LOGO VIBE MUSIC GUITAR 2.png or public/logo.jpeg."
  );
}

async function buildSquareLogo(size) {
  const source = resolveLogoSource();
  const meta = await sharp(source).metadata();
  const width = meta.width ?? size;
  const height = meta.height ?? size;

  // Wide header marks read better in tabs when we favor the left brand/guitar lockup.
  const cropWidth = width > height * 1.2 ? Math.round(width * 0.42) : width;

  return sharp(source)
    .extract({
      left: 0,
      top: 0,
      width: Math.min(cropWidth, width),
      height,
    })
    .resize(size, size, {
      fit: "contain",
      background: SQUARE_BACKGROUND,
    })
    .png()
    .toBuffer();
}

async function writeSquarePng(size, relativePath) {
  const output = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const buffer = await buildSquareLogo(size);
  fs.writeFileSync(output, buffer);
}

async function main() {
  const source = resolveLogoSource();
  console.log(`Using logo source: ${path.relative(ROOT, source)}`);

  await writeSquarePng(48, "public/icon-48.png");
  await writeSquarePng(192, "public/icon-192.png");
  await writeSquarePng(180, "public/apple-icon.png");
  await writeSquarePng(48, "src/app/icon.png");
  await writeSquarePng(180, "src/app/apple-icon.png");

  const icoBuffers = await Promise.all([16, 32, 48].map((size) => buildSquareLogo(size)));
  const ico = await toIco(icoBuffers);
  fs.writeFileSync(path.join(APP, "favicon.ico"), ico);
  fs.writeFileSync(path.join(PUBLIC, "favicon.ico"), ico);

  console.log("Generated favicon assets:");
  console.log("  public/favicon.ico");
  console.log("  src/app/favicon.ico");
  console.log("  public/icon-48.png");
  console.log("  public/icon-192.png");
  console.log("  public/apple-icon.png");
  console.log("  src/app/icon.png");
  console.log("  src/app/apple-icon.png");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
