import { NextResponse } from "next/server";
import { releaseOrderReservation } from "@/lib/server/orderService";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { orderId?: string };

    if (!body.orderId?.trim()) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    await releaseOrderReservation(body.orderId.trim());

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to release reservation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
