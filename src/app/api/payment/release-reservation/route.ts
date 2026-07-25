import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { canAccessOrder } from "@/lib/server/orderAccess";
import { getOrderById, releaseOrderReservation } from "@/lib/server/orderService";
import {
  enforceMutationSecurity,
  enforceRateLimit,
  parseJsonBody,
} from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { releaseReservationSchema } from "@/lib/validations/checkout";

export async function POST(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(
      request,
      "checkout-release-reservation",
      RATE_LIMITS.checkout
    );
    if (rateLimited) return rateLimited;

    const csrfError = enforceMutationSecurity(request);
    if (csrfError) return csrfError;

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
        { status: 401 }
      );
    }

    await releaseOrderReservation(orderId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to release reservation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
