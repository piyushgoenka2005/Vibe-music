import { NextResponse } from "next/server";
import { buildInvoiceUrls } from "@/features/invoice/server/invoiceUrls";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { getOrderById } from "@/lib/server/orderService";
import { canAccessOrder } from "@/lib/server/orderAccess";
import { getSessionUser } from "@/lib/auth/server-session";
import { getAdminSession } from "@/lib/server/adminService";
import { RATE_LIMITS } from "@/lib/security/rate-limit";

export async function GET(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const rateLimited = await enforceRateLimit(
      request,
      "order-detail",
      RATE_LIMITS.sensitiveAccess
    );
    if (rateLimited) return rateLimited;

    const { orderId } = await context.params;
    const url = new URL(request.url);
    const guestEmail = url.searchParams.get("email")?.trim().toLowerCase();
    const trackingToken = url.searchParams.get("trackingToken")?.trim();
    const sessionUser = await getSessionUser();
    const order = await getOrderById(orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!sessionUser) {
      if (
        canAccessOrder(order, {
          email: guestEmail,
          trackingToken,
        })
      ) {
        return NextResponse.json({
          order,
          invoiceUrls: buildInvoiceUrls(order),
        });
      }
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const adminSession = await getAdminSession(sessionUser.uid);
    if (adminSession) {
      return NextResponse.json({
        order,
        invoiceUrls: buildInvoiceUrls(order),
      });
    }

    if (
      canAccessOrder(order, {
        userId: sessionUser.uid,
        email: sessionUser.email ?? undefined,
        trackingToken,
      })
    ) {
      return NextResponse.json({
        order,
        invoiceUrls: buildInvoiceUrls(order),
      });
    }

    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
