/**
 * Downloads remote CDN assets locally and rewrites vibemusic.in URLs to /images/...
 * Source CDN: media/assets/cdn.sweetwater.com (original assets before brand migration)
 *
 * Run: node scripts/localize-images.mjs
 */
import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PUBLIC_IMAGES = path.join(ROOT, "public", "images");
const MANIFEST_PATH = path.join(PUBLIC_IMAGES, "manifest.json");

const DOMAIN_MAP = {
  "media.vibemusic.in": "media.sweetwater.com",
  "assets.vibemusic.in": "assets.sweetwater.com",
  "cdn.vibemusic.in": "media.sweetwater.com",
};

const SCAN_DIRS = ["src/content", "src/components"];
const SCAN_EXTENSIONS = [".html", ".tsx", ".ts", ".css"];

const LOGO_REPLACEMENTS = [
  {
    from: /https:\/\/media\.vibemusic\.in\/m\/header\/logo\/vibemusic-logo__new\.svg/g,
    to: "/logo.jpeg",
  },
  {
    from: /https:\/\/media\.sweetwater\.com\/m\/header\/logo\/sweetwater-logo__new\.svg/g,
    to: "/logo.jpeg",
  },
];

function walkFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, acc);
    else if (SCAN_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) acc.push(full);
  }
  return acc;
}

function extractUrls(content) {
  const urls = new Set();
  const pattern =
    /https:\/\/(?:media|assets|cdn)\.vibemusic\.in[^"'\s)<]+/g;
  for (const match of content.matchAll(pattern)) {
    let url = match[0];
    // Trim trailing punctuation from HTML/CSS
    url = url.replace(/[\\`;,]+$/, "");
    urls.add(url);
  }
  return urls;
}

function toRemoteUrl(localStyleUrl) {
  const withoutQuery = localStyleUrl.split("?")[0];
  for (const [from, to] of Object.entries(DOMAIN_MAP)) {
    if (withoutQuery.includes(from)) {
      return withoutQuery.replace(from, to);
    }
  }
  return withoutQuery;
}

function toLocalPath(url) {
  const withoutQuery = url.split("?")[0];
  for (const domain of Object.keys(DOMAIN_MAP)) {
    const prefix = `https://${domain}`;
    if (withoutQuery.startsWith(prefix)) {
      return `/images${withoutQuery.slice(prefix.length)}`;
    }
  }
  return null;
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      resolve("cached");
      return;
    }

    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close();
          fs.unlinkSync(dest);
          return download(res.headers.location, dest).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          file.close();
          fs.unlink(dest, () => {});
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        res.pipe(file);
        file.on("finish", () => file.close(() => resolve("downloaded")));
      })
      .on("error", (err) => {
        fs.unlink(dest, () => reject(err));
      });
  });
}

async function downloadAll(urls) {
  const manifest = fs.existsSync(MANIFEST_PATH)
    ? JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"))
    : {};

  let downloaded = 0;
  let cached = 0;
  let failed = 0;
  const failures = [];

  const list = [...urls].sort();
  const concurrency = 8;
  let index = 0;

  async function worker() {
    while (index < list.length) {
      const url = list[index++];
      const localUrl = toLocalPath(url);
      if (!localUrl) continue;

      const dest = path.join(ROOT, "public", localUrl.replace(/^\//, "").replace(/\//g, path.sep));
      const remote = toRemoteUrl(url);

      try {
        const status = await download(remote, dest);
        manifest[url] = localUrl;
        if (status === "cached") cached++;
        else downloaded++;
      } catch (error) {
        failed++;
        failures.push({ url, remote, error: error.message });
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  fs.mkdirSync(PUBLIC_IMAGES, { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  console.log(`Downloaded: ${downloaded}, cached: ${cached}, failed: ${failed}`);
  if (failures.length) {
    console.log("First failures:");
    failures.slice(0, 10).forEach((f) => console.log(`  ${f.remote} -> ${f.error}`));
  }

  return manifest;
}

function rewriteFile(filePath, manifest) {
  let content = fs.readFileSync(filePath, "utf8");
  let changed = false;

  for (const { from, to } of LOGO_REPLACEMENTS) {
    if (from.test(content)) changed = true;
    content = content.replace(from, to);
  }

  // Sort by length descending so longer URLs match first
  const entries = Object.entries(manifest).sort((a, b) => b[0].length - a[0].length);
  for (const [remote, local] of entries) {
    if (content.includes(remote)) {
      content = content.split(remote).join(local);
      changed = true;
    }
    // Also replace base URL without query when manifest key had query params
    const base = remote.split("?")[0];
    if (base !== remote && content.includes(base)) {
      content = content.split(base).join(local.split("?")[0]);
      changed = true;
    }
  }

  // Catch remaining vibemusic URLs using path mapping
  content = content.replace(
    /https:\/\/(?:media|assets|cdn)\.vibemusic\.in(\/[^"'\s)<]+)/g,
    (_, pathname) => {
      changed = true;
      return `/images${pathname.split("?")[0]}`;
    }
  );

  if (changed) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  return false;
}

async function main() {
  const files = SCAN_DIRS.flatMap((dir) => walkFiles(path.join(ROOT, dir)));
  const allUrls = new Set();

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    for (const url of extractUrls(content)) allUrls.add(url);
  }

  console.log(`Found ${allUrls.size} unique remote image URLs`);
  const manifest = await downloadAll(allUrls);

  let rewritten = 0;
  for (const file of files) {
    if (rewriteFile(file, manifest)) rewritten++;
  }

  console.log(`Rewrote ${rewritten} files`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
