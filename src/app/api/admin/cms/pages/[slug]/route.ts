import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  getContentPageFromDb,
  upsertContentPage,
} from "@/lib/server/contentPageRepository";
import { CONTENT_PAGES } from "@/data/contentPages";
import { contentPageSchema } from "@/lib/validations/wrFeatures";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin("settings:read");
    const { slug } = await context.params;
    const page =
      (await getContentPageFromDb(slug)) ?? CONTENT_PAGES[slug] ?? null;
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }
    return NextResponse.json({ page });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAdmin("settings:write", request);
    const { slug } = await context.params;
    const body = await request.json();
    const parsed = contentPageSchema.parse({ ...body, slug });
    const page = await upsertContentPage(parsed);
    return NextResponse.json({ page });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
