import { NextResponse } from "next/server";
import {
  AdminAuthError,
  requireAdmin,
  adminErrorResponse,
} from "@/lib/auth/require-admin";
import { hasAnyPermission } from "@/lib/auth/permissions";
import { deleteImageFromCdn, isCdnUrl } from "@/lib/server/cdnStorage";
import { adminDeleteImagesSchema } from "@/lib/validations/admin";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(undefined, request);
    if (
      !hasAnyPermission(admin.permissions, [
        "products:write",
        "banners:write",
        "blog:write",
      ])
    ) {
      throw new AdminAuthError("Insufficient permissions", 403);
    }

    const parsed = adminDeleteImagesSchema.parse(await request.json());
    const urls = parsed.urls.map((url) => url.trim()).filter(Boolean);

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
