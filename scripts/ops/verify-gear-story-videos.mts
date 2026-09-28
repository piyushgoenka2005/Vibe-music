/**
 * Verify gear-story reel MP4s exist on origin or CDN.
 * Usage: npm run verify:gear-videos
 *
 * Set VERIFY_GEAR_VIDEOS_STRICT=true to fail CI/deploy when no videos are reachable.
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

function reelVideoBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_REEL_VIDEO_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const cdn = process.env.NEXT_PUBLIC_CDN_PUBLIC_BASE_URL?.trim();
  if (cdn) return cdn.replace(/\/$/, "");
  return "";
}

async function remoteExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(8000) });
    return res.ok;
  } catch {
    return false;
  }
}

const base = reelVideoBaseUrl();
const results = await Promise.all(
  REEL_VIDEO_MIRROR_NAMES.map(async (name) => {
    const filePath = path.join(VIDEO_DIR, name);
    const localExists = fs.existsSync(filePath);
    const localKb = localExists ? Math.round(fs.statSync(filePath).size / 1024) : 0;
    const remoteUrl = base ? `${base}/videos/style-story/${name}` : "";
    const remoteOk = remoteUrl ? await remoteExists(remoteUrl) : false;
    return { name, localExists, localKb, remoteUrl, remoteOk };
  }),
);

const reachable = results.filter((row) => row.localExists || row.remoteOk);
const missing = results.filter((row) => !row.localExists && !row.remoteOk);

console.log("\nGear story video check — origin + CDN\n");
if (base) {
  console.log(`CDN base: ${base}\n`);
}
for (const row of results) {
  const mark = row.localExists || row.remoteOk ? "OK " : "MISS";
  const detail = row.localExists
    ? `local ${row.localKb} KB`
    : row.remoteOk
      ? "CDN reachable"
      : "poster fallback only";
  console.log(`${mark}  ${row.name.padEnd(14)} ${detail}`);
}

if (missing.length === 0) {
  console.log(`\nAll ${reachable.length} reel(s) reachable.\n`);
  process.exit(0);
}

console.log(
  `\n${missing.length} reel(s) missing on origin and CDN. Upload to public/videos/style-story/ or set NEXT_PUBLIC_REEL_VIDEO_BASE_URL.`,
);
console.log("See public/videos/style-story/README.md for naming.\n");
process.exit(process.env.VERIFY_GEAR_VIDEOS_STRICT === "true" ? 1 : 0);
