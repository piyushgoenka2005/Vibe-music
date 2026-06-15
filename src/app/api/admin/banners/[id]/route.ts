import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  deleteBanner,
  getBannerById,
  updateBanner,
} from "@/lib/server/bannerService";
import { adminBannerSchema } from "@/lib/validations/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin("banners:read");
    const { id } = await context.params;
    const banner = await getBannerById(id);
    if (!banner) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }
    return NextResponse.json({ banner });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAdmin("banners:write");
    const { id } = await context.params;
    const body = await request.json();
    const parsed = adminBannerSchema.partial().parse(body);
    const banner = await updateBanner(id, {
      ...parsed,
      mobileImage:
        parsed.mobileImage === "" ? undefined : parsed.mobileImage,
    });
    return NextResponse.json({ banner });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin("banners:delete");
    const { id } = await context.params;
    await deleteBanner(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
