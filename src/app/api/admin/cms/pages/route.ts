import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  listContentPages,
  upsertContentPage,
} from "@/lib/server/contentPageRepository";
import { contentPageSchema } from "@/lib/validations/wrFeatures";
import { logAuditEvent } from "@/lib/server/auditLog";

export async function GET() {
  try {
    await requireAdmin("settings:read");
    const pages = await listContentPages();
    return NextResponse.json({ pages });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin("settings:write", request);
    const body = await request.json();
    const parsed = contentPageSchema.parse(body);
    const page = await upsertContentPage(parsed);
    await logAuditEvent({
      action: "cms.page.created",
      actorId: admin.uid,
      actorEmail: admin.email,
      resourceType: "cms_page",
      resourceId: page.slug,
      request,
    });
    return NextResponse.json({ page }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
