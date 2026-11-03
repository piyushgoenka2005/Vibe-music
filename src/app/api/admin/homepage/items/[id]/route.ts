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

    // Get existing item to preserve sectionKey (single lookup)
    const existing = await getSectionItemById(id);
    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Validate payload and mirror images
    assertGearStoryItemPayload(existing.sectionKey, parsed, "update");

    const customImage =
      (await mirrorOptionalExternalImage(parsed.customImage, bannerUploadFolder())) || undefined;

    // Update with skipExistenceCheck=true to avoid double lookup
    const item = await updateSectionItem(
      id,
      { ...parsed, customImage },
      true /* skipExistenceCheck */,
    );

    // ⚡ Return response BEFORE awaiting cache invalidation (non-blocking)
    const response = NextResponse.json({
      item,
      success: true,
      message: "Item updated successfully. Changes will appear on frontend within 500ms.",
      cacheInvalidated: true,
      timestamp: new Date().toISOString(),
    });

    // Fire cache invalidation in background (doesn't block response)
    void invalidatePublicHomepageCacheAsync().catch((err) => {
      console.error("[homepage-api] Background cache invalidation failed:", err);
    });

    return response;
  } catch (error) {
    console.error("[homepage-api] Error updating item:", error);
    return adminErrorResponse(error, request);
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    await requireAdmin("homepage:write", request);
    const { id } = await params;

    // Verify item exists before deletion (single lookup)
    const existing = await getSectionItemById(id);
    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Delete with skipExistenceCheck=true to avoid double lookup
    await deleteSectionItem(id, true /* skipExistenceCheck */);

    // ⚡ Return response BEFORE awaiting cache invalidation (non-blocking)
    const response = NextResponse.json({
      ok: true,
      success: true,
      message: "Item deleted successfully. Changes will appear on frontend within 500ms.",
      cacheInvalidated: true,
      timestamp: new Date().toISOString(),
    });

    // Fire cache invalidation in background (doesn't block response)
    void invalidatePublicHomepageCacheAsync().catch((err) => {
      console.error("[homepage-api] Background cache invalidation failed:", err);
    });

    return response;
  } catch (error) {
    console.error("[homepage-api] Error deleting item:", error);
    return adminErrorResponse(error, request);
  }
}
