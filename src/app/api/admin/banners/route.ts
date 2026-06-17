import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  createBanner,
  listAllBanners,
} from "@/lib/server/bannerService";
import { paginateSortedById } from "@/lib/admin/paginateByCursor";
import { adminBannerSchema } from "@/lib/validations/admin";

export async function GET(request: Request) {
  try {
    await requireAdmin("banners:read");
    const { searchParams } = new URL(request.url);
    const banners = await listAllBanners();
    const page = paginateSortedById(banners, {
      limit: Number(searchParams.get("limit") ?? 20),
      cursor: searchParams.get("cursor") ?? undefined,
    });
    return NextResponse.json({
      banners: page.items,
      hasMore: page.hasMore,
      nextCursor: page.nextCursor,
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin("banners:write", request);
    const body = await request.json();
    const parsed = adminBannerSchema.parse(body);
    const banner = await createBanner({
      ...parsed,
      mobileImage: parsed.mobileImage || undefined,
      startDate: parsed.startDate ?? null,
      endDate: parsed.endDate ?? null,
    });
    return NextResponse.json({ banner }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
