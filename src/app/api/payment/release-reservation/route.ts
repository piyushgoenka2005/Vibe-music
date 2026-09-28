import { NextResponse } from "next/server";
import { traceRouteHandler } from "@/lib/api/traceRoute";
import { parseJsonBody, withApiGuards } from "@/lib/api/route-utils";
import { getSessionUser } from "@/lib/auth/server-session";
import { canAccessOrder } from "@/lib/server/orderAccess";
import { getOrderById, releaseOrderReservation } from "@/lib/server/orderService";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { releaseReservationSchema } from "@/lib/validations/checkout";

async function postHandler(request: Request) {
  return withApiGuards(
    request,
    {
      context: "api/payment/release-reservation",
      scope: "checkout-release-reservation",
      rateLimit: RATE_LIMITS.checkout,
    },
    async () => {
      const parsed = await parseJsonBody(request, releaseReservationSchema);
      if ("error" in parsed) return parsed.error;

      const orderId = parsed.data.orderId;
      const order = await getOrderById(orderId);
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      const sessionUser = await getSessionUser();
      const trackingToken = parsed.data.trackingToken;

      if (
        !canAccessOrder(order, {
          userId: sessionUser?.uid,
          email: sessionUser?.email ?? undefined,
          trackingToken,
        })
      ) {
        return NextResponse.json(
          { error: "Authentication required to release reservation" },
          { status: 401 },
        );
      }

      await releaseOrderReservation(orderId);

      return NextResponse.json({ ok: true });
    },
  );
}

export const POST = traceRouteHandler("POST /api/payment/release-reservation", postHandler);
