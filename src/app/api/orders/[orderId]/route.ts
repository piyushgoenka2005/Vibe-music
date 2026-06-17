import { NextResponse } from "next/server";
import { getOrderById } from "@/lib/server/orderService";
import { getSessionUser } from "@/lib/auth/server-session";
import { getAdminSession } from "@/lib/server/adminService";

export async function GET(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params;
    const guestEmail = new URL(request.url).searchParams
      .get("email")
      ?.trim()
      .toLowerCase();
    const sessionUser = await getSessionUser();
    const order = await getOrderById(orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!sessionUser) {
      if (
        guestEmail &&
        order.email?.toLowerCase() === guestEmail
      ) {
        return NextResponse.json({ order });
      }
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const adminSession = await getAdminSession(sessionUser.uid);
    if (adminSession) {
      return NextResponse.json({ order });
    }

    if (
      order.userId === sessionUser.uid ||
      (sessionUser.email &&
        order.email.toLowerCase() === sessionUser.email.toLowerCase())
    ) {
      return NextResponse.json({ order });
    }

    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
