import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  createBanner,
  listAllBanners,
} from "@/lib/server/bannerService";
import { adminBannerSchema } from "@/lib/validations/admin";

export async function GET() {
  try {
    await requireAdmin("banners:read");
    const banners = await listAllBanners();
    return NextResponse.json({ banners });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin("banners:write");
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
