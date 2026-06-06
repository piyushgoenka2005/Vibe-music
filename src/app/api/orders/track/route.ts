import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { orderId?: string; email?: string };
    const orderId = body.orderId?.trim();
    const email = body.email?.trim().toLowerCase();
    if (!orderId || !email) {
      return NextResponse.json({ error: "Order ID and email are required" }, { status: 400 });
    }

    const db = getAdminFirestore();
    const snap = await db.collection("orders").doc(orderId).get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const data = snap.data() as { email?: string };
    if ((data.email ?? "").toLowerCase() !== email) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order: { id: snap.id, ...data } });
  } catch {
    return NextResponse.json({ error: "Unable to track order" }, { status: 500 });
  }
}
