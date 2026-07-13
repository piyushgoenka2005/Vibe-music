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
const DEFAULT_WIDTH = 480;
const MEMORY_CACHE_MAX = 64;

type CachedThumb = {
  body: Buffer;
  contentType: string;
  createdAt: number;
};

/** Process-local cache so hot reloads / repeat card loads skip Sharp. */
const memoryCache = new Map<string, CachedThumb>();

function parseWidth(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 48) return DEFAULT_WIDTH;
  return Math.min(MAX_WIDTH, Math.floor(parsed));
}

function remember(key: string, entry: CachedThumb) {
  if (memoryCache.size >= MEMORY_CACHE_MAX) {
    const oldest = memoryCache.keys().next().value;
    if (oldest) memoryCache.delete(oldest);
  }
  memoryCache.set(key, entry);
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
      .webp({ quality: 72 })
      .toBuffer();

    return {
      body,
      contentType: "image/webp",
      createdAt: Date.now(),
    };
  } catch {
    // Keep serving originals if the Sharp native binary is unavailable.
    return {
      body: input,
      contentType: upstream.headers.get("content-type") || "image/png",
      createdAt: Date.now(),
    };
  }
}

export async function GET(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(
      request,
      "media-thumb",
      RATE_LIMITS.publicApi
    );
    if (rateLimited) return rateLimited;

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
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      return new NextResponse(new Uint8Array(cached.body), {
        status: 200,
        headers: {
          "Content-Type": cached.contentType,
          "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
          "X-Thumb-Cache": "hit",
        },
      });
    }

    const thumb = await buildThumb(parsed.toString(), width);
    remember(cacheKey, thumb);

    return new NextResponse(new Uint8Array(thumb.body), {
      status: 200,
      headers: {
        "Content-Type": thumb.contentType,
        "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
        "X-Thumb-Cache": "miss",
      },
    });
  } catch (error) {
    return handleRouteError(error, "api/media/thumb");
  }
}
