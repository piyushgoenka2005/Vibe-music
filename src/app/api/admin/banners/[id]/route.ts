import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { deleteBanner, getBannerById, updateBanner } from "@/lib/server/bannerService";
import { adminBannerInputSchema } from "@/lib/validations/admin";
import { bannerUploadFolder } from "@/lib/server/platform/cdnStorage";
import { mirrorOptionalExternalImage } from "@/lib/server/platform/mirrorExternalImage";

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
    await requireAdmin("banners:write", request);
    const { id } = await context.params;
    const body = await request.json();
    const parsed = adminBannerInputSchema.partial().parse(body);
    const folder = bannerUploadFolder();
    const banner = await updateBanner(id, {
      ...parsed,
      image:
        parsed.image !== undefined
          ? parsed.image
            ? await mirrorOptionalExternalImage(parsed.image, folder)
            : ""
          : undefined,
      mobileImage:
        parsed.mobileImage === ""
          ? undefined
          : await mirrorOptionalExternalImage(parsed.mobileImage, folder),
      videoUrl: parsed.videoUrl !== undefined ? parsed.videoUrl.trim() || undefined : undefined,
    });
    return NextResponse.json({ banner });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin("banners:delete", _request);
    const { id } = await context.params;
    await deleteBanner(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
