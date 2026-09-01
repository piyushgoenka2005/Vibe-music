import { NextResponse } from "next/server";
import { buildInvoiceUrls } from "@/features/invoice/server/invoiceUrls";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { getOrderById } from "@/lib/server/orderService";
import { canAccessOrder } from "@/lib/server/orderAccess";
import { getSessionUser } from "@/lib/auth/server-session";
import { getAdminSession } from "@/lib/server/adminService";
import { raceWithTimeout } from "@/lib/server/raceWithTimeout";
import { buildPublicOrderTracking } from "@/lib/server/shipmentService";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import type { Order } from "@/types/order";
import type { PublicShipmentTracking } from "@/types/shipment";
import { toOrderTracking } from "@/types/orderTracking";
import { publicApiError } from "@/lib/server/publicApiError";

const SHIPMENT_LOOKUP_MS = 400;

async function loadOrderShipment(order: Order): Promise<PublicShipmentTracking | null> {
  const result = await raceWithTimeout(
    buildPublicOrderTracking(order),
    { order: toOrderTracking(order), shipment: null },
    SHIPMENT_LOOKUP_MS
  );
  return result.shipment;
}

function orderDetailPayload(order: Order, shipment: PublicShipmentTracking | null) {
  return {
    order,
    invoiceUrls: buildInvoiceUrls(order),
    shipment,
  };
}

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
        const shipment = await loadOrderShipment(order);
        return NextResponse.json(orderDetailPayload(order, shipment));
      }
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const adminSession = await getAdminSession(sessionUser.uid);
    if (adminSession) {
      const shipment = await loadOrderShipment(order);
      return NextResponse.json(orderDetailPayload(order, shipment));
    }

    if (
      canAccessOrder(order, {
        userId: sessionUser.uid,
        email: sessionUser.email ?? undefined,
        trackingToken,
      })
    ) {
      const shipment = await loadOrderShipment(order);
      return NextResponse.json(orderDetailPayload(order, shipment));
    }

    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  } catch (error) {
    return publicApiError(error, "Unable to fetch order");
  }
}
