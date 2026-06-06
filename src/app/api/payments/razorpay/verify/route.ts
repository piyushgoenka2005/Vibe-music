import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminFirestore } from "@/lib/firebase/admin";

interface VerifyBody {
  orderId: string;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VerifyBody;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      const db = getAdminFirestore();
      await db.collection("orders").doc(body.orderId).update({
        status: "paid",
        paymentId: body.razorpay_payment_id ?? "demo-payment",
        updatedAt: new Date().toISOString(),
      });
      return NextResponse.json({ verified: true, demo: true });
    }

    const payload = `${body.razorpay_order_id}|${body.razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(payload)
      .digest("hex");

    if (expected !== body.razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const db = getAdminFirestore();
    await db.collection("orders").doc(body.orderId).update({
      status: "paid",
      paymentId: body.razorpay_payment_id,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ verified: true });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
