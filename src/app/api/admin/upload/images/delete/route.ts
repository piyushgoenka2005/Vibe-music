import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { deleteImageFromCdn, isCdnUrl } from "@/lib/server/cdnStorage";

interface DeleteImagesPayload {
  urls?: string[];
}

export async function POST(request: Request) {
  try {
    await requireAdmin("products:write", request);

    const body = (await request.json().catch(() => null)) as
      | DeleteImagesPayload
      | null;

    const urls = Array.isArray(body?.urls)
      ? body!.urls.filter((u) => typeof u === "string" && u.trim().length > 0)
      : [];

    if (urls.length === 0) {
      return NextResponse.json({ error: "No image urls provided" }, { status: 400 });
    }

    const results = await Promise.all(
      urls.map(async (url) => {
        try {
          if (!isCdnUrl(url)) {
            return { url, deleted: false, skipped: true };
          }
          const ok = await deleteImageFromCdn(url);
          return { url, deleted: ok };
        } catch {
          return { url, deleted: false };
        }
      })
    );

    return NextResponse.json({
      results,
      deleted: results.filter((r) => r.deleted).length,
      total: results.length,
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
