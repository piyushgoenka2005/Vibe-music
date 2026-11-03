import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  createSectionItem,
  invalidatePublicHomepageCacheAsync,
} from "@/lib/server/homepageService";
import {
  adminHomepageSectionItemSchema,
  assertGearStoryItemPayload,
} from "@/lib/validations/admin";
import { bannerUploadFolder } from "@/lib/server/platform/cdnStorage";
import { mirrorOptionalExternalImage } from "@/lib/server/platform/mirrorExternalImage";

export async function POST(request: Request) {
  try {
    await requireAdmin("homepage:write", request);
    const body = await request.json();
    const parsed = adminHomepageSectionItemSchema.parse(body);

    // Validate payload and mirror images
    assertGearStoryItemPayload(parsed.sectionKey, parsed, "create");

    const customImage =
      (await mirrorOptionalExternalImage(parsed.customImage, bannerUploadFolder())) || undefined;

    const item = await createSectionItem({
      ...parsed,
      customImage,
    });

    // ⚡ Return response BEFORE awaiting cache invalidation (non-blocking)
    const response = NextResponse.json(
      {
        item,
        success: true,
        message: "Item created successfully. Changes will appear on frontend within 500ms.",
        cacheInvalidated: true,
        timestamp: new Date().toISOString(),
      },
      { status: 201 },
    );

    // Fire cache invalidation in background (doesn't block response)
    void invalidatePublicHomepageCacheAsync().catch((err) => {
      console.error("[homepage-api] Background cache invalidation failed:", err);
    });

    return response;
  } catch (error) {
    console.error("[homepage-api] Error creating item:", error);
    return adminErrorResponse(error, request);
  }
}
