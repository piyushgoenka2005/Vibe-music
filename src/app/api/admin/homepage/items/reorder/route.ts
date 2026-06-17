import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  invalidatePublicHomepageCache,
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
      parsed.orderedIds
    );
    invalidatePublicHomepageCache();
    return NextResponse.json({ items });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
