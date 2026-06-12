import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { createOrder } from "@/lib/server/orderService";
import { toPaise } from "@/lib/gstCalculator";
import type { CreateOrderPayload } from "@/types/order";

export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    const body = (await request.json()) as CreateOrderPayload;

    if (!body.items?.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    if (!body.email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!body.shippingAddress?.line1 || !body.shippingAddress?.city) {
      return NextResponse.json(
        { error: "Complete shipping address is required" },
        { status: 400 }
      );
    }

    if (!body.paymentMethod || !["razorpay", "cod"].includes(body.paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

    const payload: CreateOrderPayload = {
      ...body,
      email: body.email.trim().toLowerCase(),
      buyerState: body.buyerState || body.shippingAddress.state,
      couponDiscount: body.couponDiscount ?? 0,
    };

    const { order, razorpayOrderId, keyId } = await createOrder(
      payload,
      sessionUser?.uid
    );

    if (payload.paymentMethod === "cod") {
      return NextResponse.json({ orderId: order.id, order });
    }

    if (!razorpayOrderId || !keyId) {
      return NextResponse.json(
        { error: "Unable to create Razorpay order" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      orderId: order.id,
      razorpayOrderId,
      amount: toPaise(order.total),
      currency: "INR",
      keyId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
