import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { getOrderById } from "@/lib/server/orderService";
import { initiateOrderRefund } from "@/lib/server/razorpayRefundService";
import { adminRefundSchema } from "@/lib/validations/wrFeatures";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdmin("orders:refund", request);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const parsed = adminRefundSchema.parse(body);

    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const amountPaise = parsed.amount
      ? Math.round(parsed.amount * 100)
      : undefined;

    const result = await initiateOrderRefund({
      orderId: id,
      amountPaise,
      actorEmail: admin.email,
      note: parsed.note,
      request,
    });

    const updated = await getOrderById(id);
    return NextResponse.json({
      ...result,
      order: updated,
      note: parsed.note ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Refund failed";
    if (message.includes("not found") || message.includes("No Razorpay")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return adminErrorResponse(error);
  }
}
