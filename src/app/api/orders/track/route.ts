import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { Order } from "@/types/order";

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
    const db = getAdminFirestore();
    const doc = await db.collection("orders").doc(orderId).get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = { id: doc.id, ...doc.data() } as Order;

    if (order.email?.toLowerCase() !== email) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to track order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
