import { NextResponse } from "next/server";
import { getOrderById } from "@/lib/server/orderService";
import { isPlacedOrder } from "@/lib/server/orderAccess";
import { buildPublicOrderTracking } from "@/lib/server/shipmentService";
import {
  isLegacyOrderTrackingDevFallbackEnabled,
  verifyOrderTrackingToken,
} from "@/lib/server/orderTrackingToken";
import type { OrderTrackingResponse } from "@/types/orderTracking";

function canTrackOrder(
  order: NonNullable<Awaited<ReturnType<typeof getOrderById>>>,
  trackingToken: string | undefined,
  email: string | undefined
): boolean {
  if (order.trackingToken) {
    return verifyOrderTrackingToken(order, trackingToken);
  }

  if (
    isLegacyOrderTrackingDevFallbackEnabled() &&
    email &&
    order.email?.toLowerCase() === email.trim().toLowerCase()
  ) {
    return true;
  }

  return false;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId")?.trim();
  const trackingToken = searchParams.get("trackingToken")?.trim();
  const email = searchParams.get("email")?.trim().toLowerCase();

  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  if (!trackingToken && !(isLegacyOrderTrackingDevFallbackEnabled() && email)) {
    return NextResponse.json(
      { error: "orderId and trackingToken are required" },
      { status: 400 }
    );
  }

  try {
    const order = await getOrderById(orderId);

    if (!order || !isPlacedOrder(order) || !canTrackOrder(order, trackingToken, email)) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const body: OrderTrackingResponse = await buildPublicOrderTracking(order);
    return NextResponse.json(body);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to track order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
