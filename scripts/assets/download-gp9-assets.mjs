/**
 * Mirror GP-9 marketing assets into public/gp9-assets (self-hosted for production).
 * Run: npm run download:gp9-assets
 */
import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { GP9_ASSET_DOWNLOADS, GP9_PUBLIC_ROOT } from "./gp9-asset-manifest.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DEST_ROOT = path.join(ROOT, "public", GP9_PUBLIC_ROOT);

const MIN_BYTES = {
  ".jpg": 8_000,
  ".jpeg": 8_000,
  ".webp": 4_000,
  ".png": 4_000,
  ".mp4": 50_000,
  ".hdr": 20_000,
};

function minBytesFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIN_BYTES[ext] ?? 512;
}

function download(url, dest, timeoutMs = 120_000) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const minSize = minBytesFor(dest);
    if (fs.existsSync(dest)) {
      const size = fs.statSync(dest).size;
      if (size >= minSize) {
        resolve({ skipped: true, bytes: size });
        return;
      }
      fs.unlinkSync(dest);
    }

    const file = fs.createWriteStream(dest);
    const request = https.get(
      url,
      {
        headers: {
          "User-Agent": "VibeMusic-GP9-Asset-Sync/1.0",
          Accept: "*/*",
        },
      },
      (response) => {
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          file.close();
          fs.unlink(dest, () => {});
          download(response.headers.location, dest, timeoutMs).then(resolve).catch(reject);
          return;
        }
        if (response.statusCode !== 200) {
          file.close();
          fs.unlink(dest, () => {});
          reject(new Error(`HTTP ${response.statusCode} for ${url}`));
          return;
        }
        response.pipe(file);
        file.on("finish", () => {
          file.close(() => {
            const size = fs.statSync(dest).size;
            if (size < minSize) {
              fs.unlinkSync(dest);
              reject(new Error(`File too small (${size} B): ${url}`));
              return;
            }
            resolve({ skipped: false, bytes: size });
          });
        });
      },
    );

    request.on("error", (err) => {
      file.close();
      fs.unlink(dest, () => {});
      reject(err);
    });
    request.setTimeout(timeoutMs, () => {
      request.destroy(new Error(`Timeout downloading ${url}`));
    });
  });
}

async function main() {
  console.log(`GP-9 assets → public/${GP9_PUBLIC_ROOT}/`);
  let ok = 0;
  let skipped = 0;
  const failures = [];

  for (const entry of GP9_ASSET_DOWNLOADS) {
    const dest = path.join(DEST_ROOT, entry.dest);
    process.stdout.write(`  ${entry.dest} ... `);
    try {
      const result = await download(entry.url, dest);
      if (result.skipped) {
        skipped += 1;
        console.log("cached");
      } else {
        ok += 1;
        console.log(`ok (${Math.round(result.bytes / 1024)} KB)`);
      }
    } catch (err) {
      if (entry.fallback) {
        const fallbackPath = path.join(DEST_ROOT, entry.fallback);
        if (fs.existsSync(fallbackPath)) {
          fs.copyFileSync(fallbackPath, dest);
          ok += 1;
          console.log(`fallback ← ${entry.fallback}`);
          continue;
        }
      }
      failures.push({ dest: entry.dest, url: entry.url, error: err.message });
      console.log(`FAIL — ${err.message}`);
    }
  }

  const frontGal = path.join(DEST_ROOT, "images/gallery/gp-9_front_gal.jpg");
  const interactiveDest = path.join(DEST_ROOT, "images/gp-9_interactive.jpg");
  if (fs.existsSync(frontGal) && !fs.existsSync(interactiveDest)) {
    fs.copyFileSync(frontGal, interactiveDest);
    console.log("  images/gp-9_interactive.jpg ... linked from gallery front");
  }

  console.log("");
  console.log(`Done: ${ok} downloaded, ${skipped} cached, ${failures.length} failed`);
  if (failures.length > 0) {
    console.error("\nFailures:");
    for (const f of failures) {
      console.error(`  ${f.dest}: ${f.error}`);
      console.error(`    ${f.url}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
