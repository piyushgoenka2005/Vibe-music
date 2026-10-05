import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { getOrderById } from "@/lib/server/orderService";
import { updateOrderStatus, addOrderNote, getOrderTimeline } from "@/lib/server/adminOrderService";
import { initiateOrderRefund } from "@/lib/server/razorpayRefundService";
import { adminOrderStatusSchema, adminNoteSchema } from "@/lib/validations/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin("orders:read");
    const { id } = await context.params;
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const timeline = await getOrderTimeline(id);
    return NextResponse.json({ order, timeline });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // Status update takes priority when both status and note are present
    // (admin UI always sends both together).
    if (body.status !== undefined && body.status !== null && body.status !== "") {
      const parsed = adminOrderStatusSchema.parse(body);
      const permission = parsed.status === "refunded" ? "orders:refund" : "orders:write";
      const admin = await requireAdmin(permission, request);
      const existing = await getOrderById(id);
      if (
        parsed.status === "refunded" &&
        existing?.paymentStatus === "paid" &&
        existing.razorpayPaymentId
      ) {
        await initiateOrderRefund({
          orderId: id,
          actorEmail: admin.email,
          note: parsed.note,
          request,
        });
        const order = await getOrderById(id);
        return NextResponse.json({ order, refundedViaRazorpay: true });
      }
      const order = await updateOrderStatus(id, parsed.status, admin.email, parsed.note);
      return NextResponse.json({ order });
    }

    if (body.note) {
      const admin = await requireAdmin("orders:write", request);
      const parsed = adminNoteSchema.parse(body);
      await addOrderNote(id, parsed.note, admin.email);
      const order = await getOrderById(id);
      return NextResponse.json({ order });
    }

    return NextResponse.json({ error: "Provide a status and/or note to update." }, { status: 400 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
