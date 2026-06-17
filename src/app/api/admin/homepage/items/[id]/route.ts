import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  deleteSectionItem,
  invalidatePublicHomepageCache,
  updateSectionItem,
} from "@/lib/server/homepageService";
import { adminHomepageSectionItemSchema } from "@/lib/validations/admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    await requireAdmin("homepage:write", request);
    const { id } = await params;
    const body = await request.json();
    const parsed = adminHomepageSectionItemSchema
      .omit({ sectionKey: true })
      .parse(body);
    const item = await updateSectionItem(id, {
      ...parsed,
      customImage: parsed.customImage || undefined,
    });
    invalidatePublicHomepageCache();
    return NextResponse.json({ item });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requireAdmin("homepage:write", _request);
    const { id } = await params;
    await deleteSectionItem(id);
    invalidatePublicHomepageCache();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
