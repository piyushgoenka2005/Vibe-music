/**
 * Downloads Instagram reel poster images for the Style Story section.
 * Replace matching reel-N.mp4 files in public/videos/style-story/ for full motion.
 * Run: npm run download:style-story
 */
import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT_DIR = path.join(ROOT, "public", "images", "style-story");

const REELS = [
  {
    id: "1",
    reelUrl: "https://www.instagram.com/hertzmusicindia/reel/DY1irHzlrml/",
  },
  {
    id: "2",
    reelUrl: "https://www.instagram.com/hertzmusicindia/reel/DX6yk91gCun/",
  },
  {
    id: "3",
    reelUrl: "https://www.instagram.com/hertzmusicindia/reel/DXyefWnTR1u/",
  },
  {
    id: "4",
    reelUrl: "https://www.instagram.com/hertzmusicindia/reel/DZDKCzlIvux/",
  },
  {
    id: "5",
    reelUrl: "https://www.instagram.com/hertzmusicindia/reel/DXeh-R9D-s-/",
  },
  {
    id: "6",
    reelUrl: "https://www.instagram.com/hertzmusicindia/reel/DXMnMBDyvdP/",
  },
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchJson(res.headers.location).then(resolve).catch(reject);
          return;
        }

        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const file = fs.createWriteStream(dest);

    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          fs.unlinkSync(dest);
          downloadFile(res.headers.location, dest).then(resolve).catch(reject);
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }

        res.pipe(file);
        file.on("finish", () => {
          file.close(resolve);
        });
      })
      .on("error", reject);
  });
}

async function main() {
  let ok = 0;
  let failed = 0;

  for (const reel of REELS) {
    const dest = path.join(OUT_DIR, `reel-${reel.id}.jpg`);

    try {
      const oembedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(reel.reelUrl)}`;
      const payload = await fetchJson(oembedUrl);
      const thumbnailUrl = payload.thumbnail_url;

      if (!thumbnailUrl) {
        throw new Error("missing thumbnail_url");
      }

      await downloadFile(thumbnailUrl, dest);
      console.log(`OK  reel-${reel.id}.jpg`);
      ok += 1;
    } catch (error) {
      console.error(`FAIL reel-${reel.id}: ${error.message}`);
      failed += 1;
    }
  }

  console.log(`\nDone: ${ok} ok, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

main();
