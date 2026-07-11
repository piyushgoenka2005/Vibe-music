import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { getOrderById, releaseOrderReservation } from "@/lib/server/orderService";
import { verifyOrderTrackingToken } from "@/lib/server/orderTrackingToken";

function canReleaseReservation(
  order: NonNullable<Awaited<ReturnType<typeof getOrderById>>>,
  context: {
    userId?: string;
    userEmail?: string | null;
    trackingToken?: string;
  }
): boolean {
  if (context.userId) {
    if (order.userId && order.userId === context.userId) {
      return true;
    }

    const normalizedEmail = context.userEmail?.trim().toLowerCase();
    if (normalizedEmail && order.email?.toLowerCase() === normalizedEmail) {
      return true;
    }
  }

  if (context.trackingToken && verifyOrderTrackingToken(order, context.trackingToken)) {
    return true;
  }

  return false;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      orderId?: string;
      trackingToken?: string;
    };

    const orderId = body.orderId?.trim();
    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const sessionUser = await getSessionUser();
    const trackingToken = body.trackingToken?.trim();

    if (
      !canReleaseReservation(order, {
        userId: sessionUser?.uid,
        userEmail: sessionUser?.email,
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
