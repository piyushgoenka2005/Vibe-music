/**
 * Verify gear-story reel MP4s exist under public/videos/style-story/.
 * Usage: npm run verify:gear-videos
 *
 * Missing files are non-fatal — the storefront shows poster fallbacks until
 * MP4s are uploaded on the VPS.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REEL_VIDEO_MIRROR_NAMES = [
  "reel-1.mp4",
  "reel-2.mp4",
  "reel-3.mp4",
  "reel-4.mp4",
  "reel-5.mp4",
  "reel-6.mp4",
] as const;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const VIDEO_DIR = path.join(ROOT, "public", "videos", "style-story");

const results = REEL_VIDEO_MIRROR_NAMES.map((name) => {
  const filePath = path.join(VIDEO_DIR, name);
  const exists = fs.existsSync(filePath);
  const sizeKb = exists ? Math.round(fs.statSync(filePath).size / 1024) : 0;
  return { name, exists, sizeKb };
});

const missing = results.filter((row) => !row.exists);

console.log("\nGear story video check — public/videos/style-story/\n");
for (const row of results) {
  const mark = row.exists ? "OK " : "MISS";
  const detail = row.exists ? `${row.sizeKb} KB` : "poster fallback only";
  console.log(`${mark}  ${row.name.padEnd(14)} ${detail}`);
}

if (missing.length === 0) {
  console.log("\nAll reel MP4s present.\n");
  process.exit(0);
}

console.log(
  `\n${missing.length} reel(s) missing. Upload MP4s to public/videos/style-story/ on the VPS.`
);
console.log("See public/videos/style-story/README.md for naming.\n");
process.exit(process.env.VERIFY_GEAR_VIDEOS_STRICT === "true" ? 1 : 0);
