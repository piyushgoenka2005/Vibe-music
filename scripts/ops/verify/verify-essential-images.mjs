/**
 * Verify storefront-critical static images exist on disk (post-deploy gate).
 *
 * Usage:
 *   npm run verify:images
 *   STRICT_IMAGES=1 node scripts/ops/verify/verify-essential-images.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ESSENTIAL_STATIC_IMAGE_PATHS } from "../assets/essential-static-paths.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const PUBLIC = path.join(ROOT, "public");

const EXTRA_REQUIRED = [
  "/images/guitar-1.webp",
  "/images/New Guitar.png",
  "/images/m/home/cats/thumbs/LPR59VOWCSNH.webp",
  "/images/m/home/cats/thumbs/Arrow-small.webp",
  "/images/m/home/cats/thumbs/Matriarch.webp",
  "/images/m/home/cats/thumbs/PBassAPR3SB.webp",
  "/images/m/home/cats/thumbs/ptstudioann.webp",
  "/images/m/products/thumbs/Arrow-small.webp",
  "/images/m/products/thumbs/LPR59VOWCSNH.webp",
];

function check(relativePath) {
  const diskPath = path.join(PUBLIC, relativePath.replace(/^\//, "").replace(/\//g, path.sep));
  if (!fs.existsSync(diskPath)) {
    return { ok: false, detail: "missing" };
  }
  const size = fs.statSync(diskPath).size;
  if (size < 256) {
    return { ok: false, detail: `too small (${size} bytes)` };
  }
  return { ok: true, detail: `${size} bytes` };
}

const required = [...new Set([...ESSENTIAL_STATIC_IMAGE_PATHS, ...EXTRA_REQUIRED])];
const missing = [];

console.log(`Essential image verify — ${required.length} paths\n`);

for (const relativePath of required) {
  const result = check(relativePath);
  if (!result.ok) {
    missing.push({ relativePath, detail: result.detail });
    console.log(`  FAIL ${relativePath} (${result.detail})`);
  }
}

if (missing.length === 0) {
  console.log("\nPASS — all essential storefront images present.");
  process.exit(0);
}

console.log(`\nFAIL — ${missing.length} essential image(s) missing.`);
console.log("Fix on VPS:");
console.log("  npm run download:images");
console.log("  npm run verify:images");
process.exit(1);
