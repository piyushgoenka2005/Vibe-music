import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { getAdminSession } from "@/lib/server/adminService";
import { getSessionUser } from "@/lib/auth/server-session";
import {
  OrderCancellationError,
  cancelOrderAsCustomer,
} from "@/lib/server/orderCancellationService";
import { RATE_LIMITS } from "@/lib/security/rate-limit";

export async function POST(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const rateLimited = await enforceRateLimit(
      request,
      "order-cancel",
      RATE_LIMITS.sensitiveAccess
    );
    if (rateLimited) return rateLimited;

    const { orderId } = await context.params;
    let body: { email?: string; trackingToken?: string; reason?: string } = {};
    try {
      body = (await request.json()) as typeof body;
    } catch {
      /* empty body is fine */
    }

    const sessionUser = await getSessionUser();
    const adminSession = sessionUser
      ? await getAdminSession(sessionUser.uid)
      : null;

    const result = await cancelOrderAsCustomer({
      orderId,
      sessionUid: sessionUser?.uid ?? null,
      sessionIsAdmin: Boolean(adminSession),
      guestEmail: body.email?.trim().toLowerCase() ?? null,
      trackingToken: body.trackingToken ?? null,
      reason: typeof body.reason === "string" ? body.reason : undefined,
      request,
    });

    return NextResponse.json({
      ok: true,
      order: result.order,
      refundInitiated: result.refundInitiated,
    });
  } catch (error) {
    if (error instanceof OrderCancellationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: "Unable to cancel order right now. Please contact support." },
      { status: 500 }
    );
  }
}
