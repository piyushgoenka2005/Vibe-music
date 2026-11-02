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

    // Invalidate all caches immediately so reordered items appear on frontend
    console.log(
      `[homepage-api] Reordered items for section ${parsed.sectionKey}, invalidating caches`,
    );
    await invalidatePublicHomepageCacheAsync();

    return NextResponse.json({
      items,
      success: true,
      message: "Items reordered successfully. Changes will appear on frontend within 1 second.",
      cacheInvalidated: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[homepage-api] Error reordering items:", error);
    return adminErrorResponse(error, request);
  }
}
