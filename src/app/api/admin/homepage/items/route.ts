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

    // Validate payload for specific section types
    assertGearStoryItemPayload(parsed.sectionKey, parsed, "create");

    // Mirror external images to CDN
    const item = await createSectionItem({
      ...parsed,
      customImage:
        (await mirrorOptionalExternalImage(parsed.customImage, bannerUploadFolder())) || undefined,
    });

    // Invalidate all caches immediately so new items appear on frontend
    console.log(
      `[homepage-api] Created new item ${item.id} (${item.sectionKey}), invalidating caches`,
    );
    await invalidatePublicHomepageCacheAsync();

    return NextResponse.json(
      {
        item,
        success: true,
        message: "Item created successfully. Changes will appear on frontend within 1 second.",
        cacheInvalidated: true,
        timestamp: new Date().toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[homepage-api] Error creating item:", error);
    return adminErrorResponse(error, request);
  }
}
