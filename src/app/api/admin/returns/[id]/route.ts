import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import {
  getReturnRequestById,
  updateReturnRequest,
} from "@/lib/server/returnRequestRepository";
import { notifyUserIfAllowed } from "@/lib/server/notificationRepository";
import { adminReturnRequestSchema } from "@/lib/validations/wrFeatures";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin("orders:read");
    const { id } = await context.params;
    const returnRequest = await getReturnRequestById(id);
    if (!returnRequest) {
      return NextResponse.json({ error: "Return request not found" }, { status: 404 });
    }
    return NextResponse.json({ returnRequest });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAdmin("orders:write", request);
    const { id } = await context.params;
    const body = await request.json();
    const parsed = adminReturnRequestSchema.parse(body);
    const existing = await getReturnRequestById(id);
    if (!existing) {
      return NextResponse.json({ error: "Return request not found" }, { status: 404 });
    }

    const returnRequest = await updateReturnRequest(id, parsed);

    if (
      existing.userId &&
      parsed.status &&
      parsed.status !== existing.status
    ) {
      void notifyUserIfAllowed({
        userId: existing.userId,
        type: "order_update",
        title: "Return request update",
        body: `Your return for order ${existing.orderId.slice(0, 8)}… is now ${parsed.status.replace("_", " ")}.`,
        link: `/account/orders/${existing.orderId}`,
      });
    }

    return NextResponse.json({ returnRequest });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
