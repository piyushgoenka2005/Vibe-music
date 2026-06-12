import { NextResponse } from "next/server";
import { getOrderById } from "@/lib/server/orderService";
import { getSessionUser } from "@/lib/auth/server-session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params;
    const sessionUser = await getSessionUser();
    const order = await getOrderById(orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (
      sessionUser?.email &&
      order.email.toLowerCase() !== sessionUser.email.toLowerCase()
    ) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
