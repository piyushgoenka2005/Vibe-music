import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { updateReviewStatus, deleteReview } from "@/lib/server/reviewService";
import { adminReviewStatusSchema } from "@/lib/validations/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAdmin("reviews:write", request);
    const { id } = await context.params;
    const body = await request.json();
    const parsed = adminReviewStatusSchema.parse(body);
    const review = await updateReviewStatus(id, parsed.status, {
      adminReply: parsed.adminReply,
      rejectionReason: parsed.rejectionReason,
    });
    return NextResponse.json({ review });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin("reviews:write", _request);
    const { id } = await context.params;
    await deleteReview(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
