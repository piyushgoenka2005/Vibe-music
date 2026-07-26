import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  deleteContentPage,
  getContentPageFromDb,
  isSeededContentPage,
  upsertContentPage,
} from "@/lib/server/contentPageRepository";
import { CONTENT_PAGES } from "@/data/contentPages";
import { contentPageSchema } from "@/lib/validations/wrFeatures";
import { logAuditEvent } from "@/lib/server/auditLog";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin("settings:read");
    const { slug } = await context.params;
    const fromDb = await getContentPageFromDb(slug);
    const page = fromDb ?? CONTENT_PAGES[slug] ?? null;
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }
    return NextResponse.json({
      page,
      isSeeded: isSeededContentPage(slug),
      hasDbOverride: Boolean(fromDb),
    });
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

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdmin("settings:write", request);
    const { slug } = await context.params;
    const result = await deleteContentPage(slug);
    if (!result.deleted) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }
    await logAuditEvent({
      action: result.revertedToSeed ? "cms.page.reset" : "cms.page.deleted",
      actorId: admin.uid,
      actorEmail: admin.email,
      resourceType: "cms_page",
      resourceId: slug,
      request,
    });
    return NextResponse.json({
      ok: true,
      revertedToSeed: result.revertedToSeed,
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
