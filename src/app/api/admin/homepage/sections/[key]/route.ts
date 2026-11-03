import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { invalidatePublicHomepageCacheAsync, updateSection } from "@/lib/server/homepageService";
import { adminHomepageSectionSchema } from "@/lib/validations/admin";
import type { HomepageSectionKey } from "@/types/homepage";

interface RouteParams {
  params: Promise<{ key: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    await requireAdmin("homepage:write", request);
    const { key } = await params;
    const body = await request.json();
    const parsed = adminHomepageSectionSchema.parse(body);
    const section = await updateSection(key as HomepageSectionKey, parsed);

    // ⚡ Return response BEFORE awaiting cache invalidation (non-blocking)
    const response = NextResponse.json({
      section,
      success: true,
      cacheInvalidated: true,
      timestamp: new Date().toISOString(),
    });

    // Fire cache invalidation in background (doesn't block response)
    void invalidatePublicHomepageCacheAsync().catch((err) => {
      console.error("[homepage-api] Background cache invalidation failed:", err);
    });

    return response;
  } catch (error) {
    return adminErrorResponse(error, request);
  }
}
