/**
 * Link or copy alternate reel paths into style-story slot names.
 * Usage: node scripts/assets/prepare-gear-story-videos.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const STYLE_DIR = path.join(ROOT, "public", "videos", "style-story");
const ALT_SOURCES = [
  path.join(ROOT, "public", "videos", "gear-stories", "guitar-over.mp4"),
  path.join(ROOT, "public", "videos", "gear-stories", "avusinc-video.mp4"),
  path.join(ROOT, "public", "videos", "gear-stories", "holy-man-chanting.mp4"),
];
const TARGETS = [
  "reel-1.mp4",
  "reel-2.mp4",
  "reel-3.mp4",
  "reel-4.mp4",
  "reel-5.mp4",
  "reel-6.mp4",
];

fs.mkdirSync(STYLE_DIR, { recursive: true });

let linked = 0;
for (let i = 0; i < TARGETS.length; i++) {
  const target = path.join(STYLE_DIR, TARGETS[i]);
  if (fs.existsSync(target)) continue;

  const source = ALT_SOURCES[i % ALT_SOURCES.length];
  if (!source || !fs.existsSync(source)) continue;

  try {
    fs.copyFileSync(source, target);
    console.log(`OK  ${TARGETS[i]} ← ${path.basename(source)}`);
    linked += 1;
  } catch (error) {
    console.warn(`FAIL ${TARGETS[i]}: ${error.message}`);
  }
}

if (linked === 0) {
  console.log(
    "No alternate MP4s found under public/videos/gear-stories/. Upload reel-1..6.mp4 manually."
  );
} else {
  console.log(`\nPrepared ${linked} reel file(s) in public/videos/style-story/`);
}
