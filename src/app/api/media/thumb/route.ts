import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  enforceRateLimit,
  handleRouteError,
} from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const ALLOWED_HOSTS = new Set([
  "cdn.vibemusic.in",
  "res.cloudinary.com",
]);

const MAX_WIDTH = 800;
const DEFAULT_WIDTH = 320;
const MEMORY_CACHE_MAX = 256;
const DISK_CACHE_DIR = path.join(process.cwd(), ".cache", "media-thumbs");
const CACHE_CONTROL =
  "public, max-age=604800, stale-while-revalidate=86400, immutable";

type CachedThumb = {
  body: Buffer;
  contentType: string;
};

/** Process-local LRU so repeat card loads skip Sharp / disk. */
const memoryCache = new Map<string, CachedThumb>();

/** Coalesce concurrent miss requests for the same key into one Sharp job. */
const inflight = new Map<string, Promise<CachedThumb>>();

function parseWidth(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 48) return DEFAULT_WIDTH;
  return Math.min(MAX_WIDTH, Math.floor(parsed));
}

function thumbHeaders(contentType: string, cache: "hit" | "disk" | "miss") {
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
    if (!body.length) return null;
    return { body, contentType: "image/webp" };
  } catch {
    return null;
  }
}

async function writeDiskThumb(key: string, entry: CachedThumb) {
  if (entry.contentType !== "image/webp") return;
  try {
    await mkdir(DISK_CACHE_DIR, { recursive: true });
    await writeFile(diskPathFor(key), entry.body);
  } catch {
    // Disk cache is best-effort — memory cache still helps.
  }
}

async function buildThumb(url: string, width: number): Promise<CachedThumb> {
  const upstream = await fetch(url, {
    headers: { Accept: "image/*" },
    next: { revalidate: 86400 },
  });

  if (!upstream.ok) {
    throw new Error(`Upstream image failed (${upstream.status})`);
  }

  const input = Buffer.from(await upstream.arrayBuffer());

  try {
    const sharp = (await import("sharp")).default;
    const body = await sharp(input)
      .rotate()
      .resize(width, width, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 70, effort: 4 })
      .toBuffer();

    return {
      body,
      contentType: "image/webp",
    };
  } catch {
    // Keep serving originals if the Sharp native binary is unavailable.
    return {
      body: input,
      contentType: upstream.headers.get("content-type") || "image/png",
    };
  }
}

async function getThumb(cacheKey: string, url: string, width: number) {
  const memoryHit = memoryCache.get(cacheKey);
  if (memoryHit) {
    // Refresh LRU order
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
      remember(cacheKey, built);
      void writeDiskThumb(cacheKey, built);
      return built;
    })().finally(() => {
      inflight.delete(cacheKey);
    });
    inflight.set(cacheKey, pending);
  }

  return { thumb: await pending, cache: "miss" as const };
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

    const cacheKey = `${parsed.toString()}|${width}`;

    // Serve cached thumbs without burning the public API rate limit.
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
      RATE_LIMITS.publicApi
    );
    if (rateLimited) return rateLimited;

    const { thumb, cache } = await getThumb(
      cacheKey,
      parsed.toString(),
      width
    );

    return new NextResponse(new Uint8Array(thumb.body), {
      status: 200,
      headers: thumbHeaders(thumb.contentType, cache),
    });
  } catch (error) {
    return handleRouteError(error, "api/media/thumb");
  }
}
