import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  createSectionItem,
  invalidatePublicHomepageCache,
} from "@/lib/server/homepageService";
import { adminHomepageSectionItemSchema } from "@/lib/validations/admin";

export async function POST(request: Request) {
  try {
    await requireAdmin("homepage:write", request);
    const body = await request.json();
    const parsed = adminHomepageSectionItemSchema.parse(body);
    const item = await createSectionItem({
      ...parsed,
      customImage: parsed.customImage || undefined,
    });
    invalidatePublicHomepageCache();
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
