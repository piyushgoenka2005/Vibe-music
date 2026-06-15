import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { reorderBanners } from "@/lib/server/bannerService";
import { adminBannerReorderSchema } from "@/lib/validations/admin";

export async function POST(request: Request) {
  try {
    await requireAdmin("banners:write");
    const body = await request.json();
    const { orderedIds } = adminBannerReorderSchema.parse(body);
    const banners = await reorderBanners(orderedIds);
    return NextResponse.json({ banners });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
