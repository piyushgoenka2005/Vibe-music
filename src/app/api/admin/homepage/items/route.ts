import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  createSectionItem,
  invalidatePublicHomepageCacheAsync,
} from "@/lib/server/homepageService";
import {
  adminHomepageSectionItemSchema,
  assertGearStoryItemPayload,
} from "@/lib/validations/admin";
import { bannerUploadFolder } from "@/lib/server/platform/cdnStorage";
import { mirrorOptionalExternalImage } from "@/lib/server/platform/mirrorExternalImage";

export async function POST(request: Request) {
  try {
    await requireAdmin("homepage:write", request);
    const body = await request.json();
    const parsed = adminHomepageSectionItemSchema.parse(body);
    assertGearStoryItemPayload(parsed.sectionKey, parsed, "create");
    const item = await createSectionItem({
      ...parsed,
      customImage:
        (await mirrorOptionalExternalImage(parsed.customImage, bannerUploadFolder())) || undefined,
    });
    await invalidatePublicHomepageCacheAsync();
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
