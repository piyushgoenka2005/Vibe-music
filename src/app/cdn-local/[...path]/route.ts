import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCdnStorageRoot } from "@/lib/server/cdnStorage";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
};

/**
 * Local-dev CDN stand-in: serves files written to CDN_STORAGE_ROOT.
 * Production should use nginx + CDN_PUBLIC_BASE_URL instead.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const segments = (await context.params).path ?? [];
  if (!segments.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const root = path.resolve(getCdnStorageRoot());
  const requested = path.resolve(root, ...segments);
  if (requested !== root && !requested.startsWith(root + path.sep)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const info = await stat(requested);
    if (!info.isFile()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const buffer = await readFile(requested);
    const ext = path.extname(requested).toLowerCase();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
