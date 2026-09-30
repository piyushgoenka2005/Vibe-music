/**
 * Downloads self-hosted assets referenced by the site.
 * Run: npm run download:images
 */
import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

import { ESSENTIAL_STATIC_IMAGE_PATHS } from "./essential-static-paths.mjs";
import { LOCATION_IMAGE_SOURCES } from "./location-image-sources.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PUBLIC = path.join(ROOT, "public");

const DOMAIN_MAP = {
  "media.vibemusic.in": "media.sweetwater.com",
  "assets.vibemusic.in": "assets.sweetwater.com",
  "cdn.vibemusic.in": "media.sweetwater.com",
};

const IMAGE_PATH = /\.(jpe?g|png|webp|svg|gif)(\?|$)/i;

function collectLocalPaths() {
  const paths = new Set(["/logo.jpeg"]);

  function addPath(rawPath) {
    const clean = rawPath.split("?")[0];
    if (clean.length > 220) return;
    if (!IMAGE_PATH.test(clean)) return;
    if (clean.includes(".css") || clean.includes(".map")) return;
    // CDN product masters live on cdn.vibemusic.in — not Sweetwater mirrors.
    if (clean.includes("/products/")) return;
    if (clean.includes("uuid") || clean.includes("...")) return;
    if (clean.endsWith(".svg")) return;
    if (clean.endsWith("/test.jpg") || clean === "/test.jpg") return;
    paths.add(`/images${clean}`);
  }

  function scanFile(filePath) {
    const content = fs.readFileSync(filePath, "utf8");
    for (const match of content.matchAll(/\/images(\/[^"'\s)]+)/g)) {
      addPath(match[1]);
    }
    for (const match of content.matchAll(
      /https:\/\/(?:media|assets|cdn)\.vibemusic\.in(\/[^"'\s)<]+)/g
    )) {
      addPath(match[1]);
    }
  }

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx|html|css)$/.test(entry.name)) scanFile(full);
    }
  }

  walk(path.join(ROOT, "src"));
  for (const staticPath of ESSENTIAL_STATIC_IMAGE_PATHS) {
    paths.add(staticPath);
  }
  return [...paths];
}

function localToRemote(localPath) {
  if (localPath === "/logo.jpeg") return null;
  const pathname = localPath.replace(/^\/images/, "");
  if (pathname.startsWith("/dist/") || pathname.startsWith("/static/")) {
    return `https://assets.sweetwater.com${pathname}`;
  }
  return `https://media.sweetwater.com${pathname}`;
}

function download(url, dest, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (fs.existsSync(dest) && fs.statSync(dest).size > 512) {
      resolve("cached");
      return;
    }

    const timer = setTimeout(() => {
      reject(new Error("timeout"));
    }, timeoutMs);

    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          clearTimeout(timer);
          file.close();
          fs.unlink(dest, () => {});
          download(res.headers.location || url, dest, timeoutMs).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          clearTimeout(timer);
          file.close();
          fs.unlink(dest, () => {});
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on("finish", () => {
          clearTimeout(timer);
          file.close(() => resolve("downloaded"));
        });
      })
      .on("error", (err) => {
        clearTimeout(timer);
        fs.unlink(dest, () => reject(err));
      });
  });
}

async function main() {
  const localPaths = collectLocalPaths();
  console.log(`Downloading ${localPaths.length} assets...`);

  let ok = 0;
  let failed = 0;

  for (const localPath of localPaths) {
    const dest = path.join(PUBLIC, localPath.replace(/^\//, "").replace(/\//g, path.sep));
    const remote = localToRemote(localPath);
    if (!remote) {
      if (fs.existsSync(dest)) ok++;
      continue;
    }

    try {
      await download(remote, dest);
      ok++;
      process.stdout.write(".");
    } catch (error) {
      failed++;
      console.log(`\nFailed ${localPath}: ${error.message}`);
    }
  }

  console.log(`\nStorefront assets. OK: ${ok}, failed: ${failed}`);

  console.log(`Downloading ${LOCATION_IMAGE_SOURCES.length} location images...`);
  for (const { localPath, url } of LOCATION_IMAGE_SOURCES) {
    const dest = path.join(PUBLIC, localPath.replace(/^\//, "").replace(/\//g, path.sep));
    try {
      await download(url, dest);
      ok++;
      process.stdout.write(".");
    } catch (error) {
      failed++;
      console.log(`\nFailed ${localPath}: ${error.message}`);
    }
  }

  console.log(`\nDone. OK: ${ok}, failed: ${failed}`);

  console.log("Generating category + marquee WebP thumbs...");
  const { spawnSync } = await import("node:child_process");
  const thumbs = spawnSync("node", ["scripts/assets/generate-category-thumbs.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (thumbs.status !== 0) {
    console.warn("WARN: generate-category-thumbs failed (non-fatal for deploy)");
  }

  const verify = spawnSync("node", ["scripts/ops/verify-essential-images.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (verify.status !== 0) {
    console.error("ERROR: essential image verify failed after download");
    process.exit(1);
  }

  if (fs.existsSync(path.join(PUBLIC, "logo.jpeg"))) {
    const { spawnSync } = await import("node:child_process");
    const result = spawnSync("node", ["scripts/assets/generate-favicons.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
    if (result.status !== 0) {
      console.warn("WARN: favicon generation skipped (non-fatal for deploy)");
    }
  }

  // https downloads can leave sockets open; npm would wait forever otherwise.
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
