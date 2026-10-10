/**
 * Crawls the public storefront (sitemap + every same-origin link found) and reports
 * internal links/images that do not resolve to HTTP 200.
 *
 * Usage: VERIFY_BASE_URL=https://vibemusic.in npx tsx scripts/ops/verify/verify-internal-links.mts
 * Env:   CRAWL_MAX_PAGES (default 1500), CRAWL_CONCURRENCY (default 3)
 */

const BASE = (process.env.VERIFY_BASE_URL ?? "https://vibemusic.in").replace(/\/$/, "");
const ORIGIN = new URL(BASE).origin;
const MAX_PAGES = Number(process.env.CRAWL_MAX_PAGES ?? 1500);
const CONCURRENCY = Number(process.env.CRAWL_CONCURRENCY ?? 3);

/** Auth-gated areas legitimately redirect to sign-in; only check they do not 404/5xx. */
const AUTH_GATED = /^\/(account|admin|checkout)(\/|$)/;
const SKIP = /^\/(_next|api|cdn-cgi)\//;
const ASSET_EXT = /\.(png|jpe?g|webp|avif|gif|svg|ico|glb|gltf|mp3|mp4|webm|woff2?|pdf|json|webmanifest|xml|txt)$/i;

type Result = { status: number; location?: string; html?: string };

const pageResults = new Map<string, Result>();
const assetResults = new Map<string, number>();
const referrers = new Map<string, Set<string>>();

function addRef(target: string, from: string) {
  let set = referrers.get(target);
  if (!set) referrers.set(target, (set = new Set()));
  if (set.size < 5) set.add(from);
}

function normalize(raw: string, from: string): string | null {
  const href = raw.replace(/&amp;/g, "&").trim();
  if (!href || href.startsWith("#") || /^(mailto|tel|javascript|data|sms|whatsapp):/i.test(href)) return null;
  let url: URL;
  try {
    url = new URL(href, `${ORIGIN}${from}`);
  } catch {
    return null;
  }
  if (url.origin !== ORIGIN) return null;
  url.hash = "";
  return `${url.pathname}${url.search}`;
}

async function fetchWithRetry(path: string, method: "GET" | "HEAD"): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(/^https?:\/\//i.test(path) ? path : `${ORIGIN}${path}`, {
      method,
      redirect: "manual",
      headers: { "user-agent": "VibeLinkCheck/1.0 (+ops verify)" },
    });
    if (response.status !== 429 || attempt >= 4) return response;
    await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
  }
}

async function checkPage(path: string): Promise<Result> {
  let current = path;
  for (let hop = 0; hop < 6; hop++) {
    const response = await fetchWithRetry(current, "GET");
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location") ?? "";
      await response.body?.cancel();
      const next = new URL(location, `${ORIGIN}${current}`);
      if (next.origin !== ORIGIN) return { status: 200, location: next.href };
      current = `${next.pathname}${next.search}`;
      continue;
    }
    const type = response.headers.get("content-type") ?? "";
    const html = type.includes("text/html") ? await response.text() : undefined;
    if (!html) await response.body?.cancel();
    return { status: response.status, location: current !== path ? current : undefined, html };
  }
  return { status: 310, location: current };
}

async function checkAsset(path: string): Promise<number> {
  try {
    return await checkAssetOnce(path);
  } catch {
    return 0;
  }
}

async function checkAssetOnce(path: string): Promise<number> {
  const response = await fetchWithRetry(path, path.startsWith("/_next/image") ? "GET" : "HEAD");
  if (path.startsWith("/_next/image")) await response.body?.cancel();
  if (response.status === 405) {
    const get = await fetchWithRetry(path, "GET");
    await get.body?.cancel();
    return get.status;
  }
  return response.status >= 300 && response.status < 400 ? 200 : response.status;
}

function extract(html: string, from: string) {
  const links: string[] = [];
  const assets: string[] = [];
  for (const m of html.matchAll(/<a\b[^>]*?\shref="([^"]+)"/gi)) {
    const path = normalize(m[1], from);
    if (path) links.push(path);
  }
  for (const m of html.matchAll(/<(?:img|source|link)\b[^>]*?\s(?:src|href)="([^"]+)"/gi)) {
    const raw = m[1].replace(/&amp;/g, "&");
    if (/^https?:\/\//i.test(raw) && !raw.startsWith(ORIGIN)) {
      if (ASSET_EXT.test(new URL(raw).pathname)) assets.push(raw);
      continue;
    }
    const path = normalize(raw, from);
    if (!path) continue;
    if (path.startsWith("/_next/image?")) {
      const source = new URL(path, ORIGIN).searchParams.get("url");
      if (source) assets.push(`/_next/image?url=${encodeURIComponent(source)}&w=640&q=75`);
    } else if (!path.startsWith("/_next/") && ASSET_EXT.test(path.split("?")[0])) {
      assets.push(path);
    }
  }
  return { links, assets };
}

const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
const queue: string[] = ["/"];
for (const m of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const path = normalize(m[1], "/");
  if (path) queue.push(path);
}
const queued = new Set(queue);
const assetQueue: string[] = [];
const assetQueued = new Set<string>();

async function worker() {
  while (queue.length || assetQueue.length) {
    const page = queue.shift();
    if (page !== undefined) {
      const result = await checkPage(page).catch((): Result => ({ status: 0 }));
      pageResults.set(page, result);
      const finalPath = result.location ?? page;
      if (result.html && !AUTH_GATED.test(finalPath)) {
        const { links, assets } = extract(result.html, finalPath);
        for (const link of links) {
          addRef(link, page);
          const bare = link.split("?")[0];
          if (SKIP.test(bare)) continue;
          if (ASSET_EXT.test(bare)) {
            if (!assetQueued.has(link)) {
              assetQueued.add(link);
              assetQueue.push(link);
            }
            continue;
          }
          if (!queued.has(link) && queued.size < MAX_PAGES) {
            queued.add(link);
            queue.push(link);
          }
        }
        for (const asset of assets) {
          addRef(asset, page);
          if (!assetQueued.has(asset)) {
            assetQueued.add(asset);
            assetQueue.push(asset);
          }
        }
      }
      continue;
    }
    const asset = assetQueue.shift();
    if (asset !== undefined) assetResults.set(asset, await checkAsset(asset));
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

const brokenPages = [...pageResults].filter(([, r]) => r.status !== 200);
const brokenAssets = [...assetResults].filter(([, s]) => s !== 200);

console.log(`Crawled ${pageResults.size} pages, ${assetResults.size} assets on ${ORIGIN}`);
for (const [path, r] of brokenPages) {
  console.log(`PAGE  ${r.status}  ${path}${r.location ? ` -> ${r.location}` : ""}`);
  console.log(`      from: ${[...(referrers.get(path) ?? ["(sitemap)"])].join(", ")}`);
}
for (const [path, status] of brokenAssets) {
  console.log(`ASSET ${status}  ${path}`);
  console.log(`      from: ${[...(referrers.get(path) ?? [])].join(", ")}`);
}
console.log(`\n${brokenPages.length + brokenAssets.length === 0 ? "PASS" : "FAIL"}: ${brokenPages.length} broken pages, ${brokenAssets.length} broken assets`);
process.exit(brokenPages.length + brokenAssets.length === 0 ? 0 : 1);
