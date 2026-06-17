import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { getOrderById } from "@/lib/server/orderService";
import { updateOrderStatus, addOrderNote } from "@/lib/server/adminOrderService";
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
    return NextResponse.json({ order });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdmin("orders:write", request);
    const { id } = await context.params;
    const body = await request.json();

    if (body.note) {
      const parsed = adminNoteSchema.parse(body);
      await addOrderNote(id, parsed.note, admin.email);
      const order = await getOrderById(id);
      return NextResponse.json({ order });
    }

    const parsed = adminOrderStatusSchema.parse(body);
    const order = await updateOrderStatus(
      id,
      parsed.status,
      admin.email,
      parsed.note
    );
    return NextResponse.json({ order });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
