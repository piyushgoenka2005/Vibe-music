import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  deleteSectionItem,
  invalidatePublicHomepageCacheAsync,
  updateSectionItem,
} from "@/lib/server/homepageService";
import {
  adminHomepageSectionItemSchema,
  assertGearStoryItemPayload,
} from "@/lib/validations/admin";
import { getSectionItemById } from "@/lib/server/homepageService";
import { bannerUploadFolder } from "@/lib/server/platform/cdnStorage";
import { mirrorOptionalExternalImage } from "@/lib/server/platform/mirrorExternalImage";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    await requireAdmin("homepage:write", request);
    const { id } = await params;
    const body = await request.json();

    // Validate incoming data
    const parsed = adminHomepageSectionItemSchema.omit({ sectionKey: true }).parse(body);

    // Get existing item to preserve sectionKey
    const existing = await getSectionItemById(id);
    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Validate payload for specific section types (gear_stories requires video URL and title)
    assertGearStoryItemPayload(existing.sectionKey, parsed, "update");

    // Mirror external images to CDN
    const item = await updateSectionItem(id, {
      ...parsed,
      customImage:
        (await mirrorOptionalExternalImage(parsed.customImage, bannerUploadFolder())) || undefined,
    });

    // Invalidate all caches immediately so changes appear on frontend
    console.log(`[homepage-api] Invalidating caches for item ${id} (${existing.sectionKey})`);
    await invalidatePublicHomepageCacheAsync();

    return NextResponse.json({
      item,
      success: true,
      message: "Item updated successfully. Changes will appear on frontend within 1 second.",
      cacheInvalidated: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[homepage-api] Error updating item:", error);
    return adminErrorResponse(error, request);
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    await requireAdmin("homepage:write", request);
    const { id } = await params;

    const existing = await getSectionItemById(id);

    await deleteSectionItem(id);

    // Invalidate all caches immediately
    console.log(`[homepage-api] Invalidating caches after deleting item ${id}`);
    await invalidatePublicHomepageCacheAsync();

    return NextResponse.json({
      ok: true,
      success: true,
      message: "Item deleted successfully. Changes will appear on frontend within 1 second.",
      cacheInvalidated: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[homepage-api] Error deleting item:", error);
    return adminErrorResponse(error, request);
  }
}
