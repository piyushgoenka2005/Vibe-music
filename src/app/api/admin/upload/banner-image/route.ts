import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse, AdminAuthError } from "@/lib/auth/require-admin";
import { hasAnyPermission } from "@/lib/auth/permissions";
import { bannerUploadFolder } from "@/lib/server/cdnStorage";
import { uploadOptimizedImageToCdn } from "@/lib/server/cdnImageOptimize";
import {
  ADMIN_IMAGE_MAX_BYTES,
  readAndValidateImageFile,
} from "@/lib/security/imageUploadValidation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(undefined, request);
    if (
      !hasAnyPermission(admin.permissions, [
        "banners:write",
        "homepage:write",
        "categories:write",
        "products:write",
        "giveaways:write",
        "rentals:write",
      ])
    ) {
      throw new AdminAuthError("Insufficient permissions", 403);
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const validated = await readAndValidateImageFile(file, ADMIN_IMAGE_MAX_BYTES);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const uploaded = await uploadOptimizedImageToCdn(validated.buffer, {
      folder: bannerUploadFolder(),
      filenameHint: file.name,
    });

    // Hero slides and homepage cards render full-bleed up to ~1920px wide, so store the highest
    // quality variant (master WebP ≤2000px) instead of the w960 card default.
    return NextResponse.json({
      url: uploaded.masterUrl || uploaded.url,
      masterUrl: uploaded.masterUrl,
      derivatives: uploaded.derivatives,
    });
  } catch (error) {
    return adminErrorResponse(error, request);
  }
}
