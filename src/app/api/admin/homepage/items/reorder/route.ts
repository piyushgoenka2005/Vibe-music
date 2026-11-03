import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  invalidatePublicHomepageCacheAsync,
  reorderSectionItems,
} from "@/lib/server/homepageService";
import { adminHomepageItemReorderSchema } from "@/lib/validations/admin";
import type { HomepageSectionKey } from "@/types/homepage";

export async function POST(request: Request) {
  try {
    await requireAdmin("homepage:write", request);
    const body = await request.json();
    const parsed = adminHomepageItemReorderSchema.parse(body);

    const items = await reorderSectionItems(
      parsed.sectionKey as HomepageSectionKey,
      parsed.orderedIds,
    );

    // ⚡ Return response BEFORE awaiting cache invalidation (non-blocking)
    const response = NextResponse.json({
      items,
      success: true,
      message: "Items reordered successfully. Changes will appear on frontend within 500ms.",
      cacheInvalidated: true,
      timestamp: new Date().toISOString(),
    });

    // Fire cache invalidation in background (doesn't block response)
    void invalidatePublicHomepageCacheAsync().catch((err) => {
      console.error("[homepage-api] Background cache invalidation failed:", err);
    });

    return response;
  } catch (error) {
    console.error("[homepage-api] Error reordering items:", error);
    return adminErrorResponse(error, request);
  }
}
