import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  approveFinanceApplication,
  markFinanceUnderReview,
  rejectFinanceApplication,
} from "@/lib/server/financeApplicationService";
import { getFinanceApplicationById } from "@/lib/server/financeRepository";
import { adminFinanceRejectSchema } from "@/lib/validations/admin-finance";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin("finance:read");
    const { id } = await context.params;
    const application = await getFinanceApplicationById(id);
    if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ application });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin("finance:write", request);
    const { id } = await context.params;
    const body = await request.json();

    if (body.action === "approve") {
      const application = await approveFinanceApplication({
        applicationId: id,
        actorId: admin.uid,
        actorEmail: admin.email,
        note: body.note,
        request,
      });
      return NextResponse.json({ application });
    }

    if (body.action === "reject") {
      const parsed = adminFinanceRejectSchema.parse(body);
      const application = await rejectFinanceApplication({
        applicationId: id,
        reason: parsed.reason,
        actorId: admin.uid,
        actorEmail: admin.email,
        request,
      });
      return NextResponse.json({ application });
    }

    if (body.action === "review") {
      const application = await markFinanceUnderReview(id, admin.uid);
      return NextResponse.json({ application });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
