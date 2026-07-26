import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  enforceRateLimit,
  handleRouteError,
} from "@/lib/api/route-utils";
import {
  isThumbPlaceholderBody,
} from "@/lib/mediaThumb";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { snapStorefrontThumbWidth } from "@/lib/storefrontImages";

export const runtime = "nodejs";

const ALLOWED_HOSTS = new Set([
  "cdn.vibemusic.in",
  "res.cloudinary.com",
]);

const MAX_WIDTH = 2000;
const DEFAULT_WIDTH = 800;
/** Abort upstream masters larger than this before buffering fully. */
const MAX_UPSTREAM_BYTES = 24_000_000;
const MEMORY_CACHE_MAX = 256;
const DISK_CACHE_DIR = path.join(process.cwd(), ".cache", "media-thumbs");
const CACHE_CONTROL =
  "public, max-age=604800, stale-while-revalidate=86400, immutable";
/** Allow time to pull large PNG masters once; cached WebP thereafter. */
const UPSTREAM_TIMEOUT_MS = 20_000;

type CachedThumb = {
  body: Buffer;
  contentType: string;
};

const memoryCache = new Map<string, CachedThumb>();
const inflight = new Map<string, Promise<CachedThumb | null>>();

function parseWidth(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 48) return DEFAULT_WIDTH;
  return snapStorefrontThumbWidth(Math.min(MAX_WIDTH, Math.floor(parsed)));
}

function thumbHeaders(
  contentType: string,
  cache: "hit" | "disk" | "miss"
) {
  return {
    "Content-Type": contentType,
    "Cache-Control": CACHE_CONTROL,
    "X-Thumb-Cache": cache,
    "X-Content-Type-Options": "nosniff",
  };
}

function remember(key: string, entry: CachedThumb) {
  if (memoryCache.has(key)) memoryCache.delete(key);
  memoryCache.set(key, entry);
  while (memoryCache.size > MEMORY_CACHE_MAX) {
    const oldest = memoryCache.keys().next().value;
    if (!oldest) break;
    memoryCache.delete(oldest);
  }
}

function diskPathFor(key: string) {
  const hash = createHash("sha1").update(key).digest("hex");
  return path.join(DISK_CACHE_DIR, `${hash}.webp`);
}

async function readDiskThumb(key: string): Promise<CachedThumb | null> {
  try {
    const body = await readFile(diskPathFor(key));
    if (!body.length || isThumbPlaceholderBody(body)) return null;
    return { body, contentType: "image/webp" };
  } catch {
    return null;
  }
}

async function writeDiskThumb(key: string, entry: CachedThumb) {
  if (entry.contentType !== "image/webp" || isThumbPlaceholderBody(entry.body)) {
    return;
  }
  try {
    await mkdir(DISK_CACHE_DIR, { recursive: true });
    await writeFile(diskPathFor(key), entry.body);
  } catch {
    // Disk cache is best-effort — memory cache still helps.
  }
}

async function readUpstreamBody(response: Response): Promise<Buffer | null> {
  const contentLength = Number(response.headers.get("content-length") ?? "");
  if (Number.isFinite(contentLength) && contentLength > MAX_UPSTREAM_BYTES) {
    return null;
  }

  if (!response.body) {
    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer.byteLength > MAX_UPSTREAM_BYTES ? null : buffer;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > MAX_UPSTREAM_BYTES) {
      try {
        await reader.cancel();
      } catch {
        /* ignore */
      }
      return null;
    }
    chunks.push(value);
  }

  return Buffer.concat(chunks.map((c) => Buffer.from(c)));
}

async function buildThumb(url: string, width: number): Promise<CachedThumb | null> {
  try {
    const upstream = await fetch(url, {
      headers: { Accept: "image/*" },
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (upstream.status >= 300 && upstream.status < 400) {
      // Refuse redirect chains — host allowlist is only checked on the request URL.
      return null;
    }

    if (!upstream.ok) {
      return null;
    }

    const input = await readUpstreamBody(upstream);
    if (!input || input.byteLength === 0) {
      return null;
    }

    const sharp = (await import("sharp")).default;
    const body = await sharp(input, { failOn: "none" })
      .rotate()
      .resize(width, width, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 92, effort: 4 })
      .toBuffer();

    if (isThumbPlaceholderBody(body)) {
      return null;
    }

    return { body, contentType: "image/webp" };
  } catch {
    return null;
  }
}

async function getThumb(cacheKey: string, url: string, width: number) {
  const memoryHit = memoryCache.get(cacheKey);
  if (memoryHit) {
    remember(cacheKey, memoryHit);
    return { thumb: memoryHit, cache: "hit" as const };
  }

  const diskHit = await readDiskThumb(cacheKey);
  if (diskHit) {
    remember(cacheKey, diskHit);
    return { thumb: diskHit, cache: "disk" as const };
  }

  let pending = inflight.get(cacheKey);
  if (!pending) {
    pending = (async () => {
      const built = await buildThumb(url, width);
      if (built) {
        remember(cacheKey, built);
        void writeDiskThumb(cacheKey, built);
      }
      return built;
    })().finally(() => {
      inflight.delete(cacheKey);
    });
    inflight.set(cacheKey, pending);
  }

  const thumb = await pending;
  if (!thumb) {
    return { thumb: null, cache: "miss" as const };
  }

  return { thumb, cache: "miss" as const };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUrl = searchParams.get("url")?.trim() ?? "";
    const width = parseWidth(searchParams.get("w"));

    if (!rawUrl) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return NextResponse.json({ error: "Invalid url" }, { status: 400 });
    }

    if (parsed.protocol !== "https:" || !ALLOWED_HOSTS.has(parsed.hostname)) {
      return NextResponse.json({ error: "Host not allowed" }, { status: 400 });
    }

    const cacheKey = `v5|${parsed.toString()}|${width}`;

    const memoryHit = memoryCache.get(cacheKey);
    if (memoryHit) {
      remember(cacheKey, memoryHit);
      return new NextResponse(new Uint8Array(memoryHit.body), {
        status: 200,
        headers: thumbHeaders(memoryHit.contentType, "hit"),
      });
    }

    const diskHit = await readDiskThumb(cacheKey);
    if (diskHit) {
      remember(cacheKey, diskHit);
      return new NextResponse(new Uint8Array(diskHit.body), {
        status: 200,
        headers: thumbHeaders(diskHit.contentType, "disk"),
      });
    }

    const rateLimited = await enforceRateLimit(
      request,
      "media-thumb",
      RATE_LIMITS.mediaThumb
    );
    if (rateLimited) {
      // Prefer a live CDN image over a blank card under burst traffic.
      return NextResponse.redirect(parsed.toString(), {
        status: 302,
        headers: {
          "Cache-Control": "public, max-age=15",
          "Retry-After": "15",
          "X-Thumb-Cache": "rate-limited-redirect",
        },
      });
    }

    const { thumb, cache } = await getThumb(
      cacheKey,
      parsed.toString(),
      width
    );

    if (!thumb) {
      // Never leave product rails blank — fall back to the upstream CDN asset.
      return NextResponse.redirect(parsed.toString(), {
        status: 302,
        headers: {
          "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
          "X-Thumb-Cache": "miss-redirect",
        },
      });
    }

    return new NextResponse(new Uint8Array(thumb.body), {
      status: 200,
      headers: thumbHeaders(thumb.contentType, cache),
    });
  } catch (error) {
    return handleRouteError(error, "api/media/thumb");
  }
}
