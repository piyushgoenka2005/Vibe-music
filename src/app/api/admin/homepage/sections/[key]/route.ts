import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  invalidatePublicHomepageCache,
  updateSection,
} from "@/lib/server/homepageService";
import { adminHomepageSectionSchema } from "@/lib/validations/admin";
import type { HomepageSectionKey } from "@/types/homepage";

interface RouteParams {
  params: Promise<{ key: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    await requireAdmin("homepage:write");
    const { key } = await params;
    const body = await request.json();
    const parsed = adminHomepageSectionSchema.parse(body);
    const section = await updateSection(key as HomepageSectionKey, parsed);
    invalidatePublicHomepageCache();
    return NextResponse.json({ section });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
