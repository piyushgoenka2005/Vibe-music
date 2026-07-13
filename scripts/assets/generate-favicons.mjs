/**
 * Build square favicon assets for browsers and Google Search.
 * Source: public/Favicon.png
 * Run: npm run generate:favicons
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import toIco from "to-ico";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PUBLIC = path.join(ROOT, "public");
const APP = path.join(ROOT, "src/app");

const LOGO_CANDIDATES = [
  path.join(PUBLIC, "Favicon.png"),
  path.join(PUBLIC, "favicon.png"),
  path.join(PUBLIC, "images/FINAL LOGO VIBE MUSIC GUITAR 2.png"),
  path.join(PUBLIC, "logo.jpeg"),
];

const SQUARE_BACKGROUND = { r: 255, g: 255, b: 255, alpha: 1 };

function resolveLogoSource() {
  for (const candidate of LOGO_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(
    "Missing logo source. Expected public/Favicon.png (or fallback logo files)."
  );
}

async function buildSquareLogo(size) {
  const source = resolveLogoSource();

  return sharp(source)
    .resize(size, size, {
      fit: "contain",
      background: SQUARE_BACKGROUND,
    })
    .ensureAlpha()
    .png({ force: true })
    .toBuffer();
}

async function writeSquarePng(size, relativePath) {
  const output = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const buffer = await buildSquareLogo(size);
  fs.writeFileSync(output, buffer);
  console.log(`  ${relativePath} (${size}x${size})`);
}

async function main() {
  const source = resolveLogoSource();
  console.log(`Using logo source: ${path.relative(ROOT, source)}`);

  await writeSquarePng(48, "public/icon-48.png");
  await writeSquarePng(192, "public/icon-192.png");
  await writeSquarePng(512, "public/icon-512.png");
  await writeSquarePng(180, "public/apple-icon.png");
  await writeSquarePng(32, "src/app/icon.png");
  await writeSquarePng(180, "src/app/apple-icon.png");

  const icoBuffers = await Promise.all([16, 32, 48].map((size) => buildSquareLogo(size)));
  const ico = await toIco(icoBuffers);
  fs.writeFileSync(path.join(APP, "favicon.ico"), ico);
  fs.writeFileSync(path.join(PUBLIC, "favicon.ico"), ico);
  console.log("  src/app/favicon.ico");
  console.log("  public/favicon.ico");

  const manifest = {
    name: "Vibe Music",
    short_name: "VibeMusic",
    description:
      "Vibe Music is India's trusted destination for musical instruments, pro audio, accessories, and expert gear advice.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1253ed",
    icons: [
      {
        src: "/icon-48.png",
        sizes: "48x48",
        type: "image/png",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
  fs.writeFileSync(
    path.join(PUBLIC, "site.webmanifest"),
    `${JSON.stringify(manifest, null, 2)}\n`
  );
  console.log("  public/site.webmanifest");
  console.log("Favicon assets generated.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
