import { NextResponse } from "next/server";
import { verifyAndCompletePayment } from "@/lib/server/orderService";
import type { VerifyPaymentPayload } from "@/types/order";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VerifyPaymentPayload;

    if (
      !body.orderId ||
      !body.razorpayOrderId ||
      !body.razorpayPaymentId ||
      !body.razorpaySignature
    ) {
      return NextResponse.json(
        { error: "Missing payment verification fields" },
        { status: 400 }
      );
    }

    const order = await verifyAndCompletePayment(body);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      paymentStatus: order.paymentStatus,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Payment verification failed";
    const status = message.includes("Invalid") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
