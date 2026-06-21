import { NextResponse } from "next/server";
import { getOrderById } from "@/lib/server/orderService";
import { buildPublicOrderTracking } from "@/lib/server/shipmentService";
import type { OrderTrackingResponse } from "@/types/orderTracking";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId")?.trim();
  const email = searchParams.get("email")?.trim().toLowerCase();

  if (!orderId || !email) {
    return NextResponse.json(
      { error: "orderId and email are required" },
      { status: 400 }
    );
  }

  try {
    const order = await getOrderById(orderId);

    if (!order || order.email?.toLowerCase() !== email) {
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
