import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { formatCheckoutError } from "@/lib/server/checkoutErrors";
import { isDemoPaymentsAllowed, isRazorpayConfigured } from "@/lib/server/env";
import { completeOrderPayment } from "@/lib/server/orderPaymentService";
import {
  getOrderById,
  linkGuestOrdersToUser,
} from "@/lib/server/orderService";

export async function POST(request: Request) {
  if (!isDemoPaymentsAllowed() || isRazorpayConfigured()) {
    return NextResponse.json(
      { error: "Demo payments are not available." },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as { orderId?: string; email?: string };
    const orderId = body.orderId?.trim();
    const email = body.email?.trim().toLowerCase();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required." }, { status: 400 });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (email && order.email.toLowerCase() !== email) {
      return NextResponse.json({ error: "Order email does not match." }, { status: 403 });
    }

    if (order.paymentMethod === "cod") {
      return NextResponse.json(
        { error: "Cash on delivery orders cannot use demo payment." },
        { status: 400 }
      );
    }

    if (order.paymentStatus === "paid") {
      const params = new URLSearchParams({ orderId: order.id });
      if (order.trackingToken) {
        params.set("trackingToken", order.trackingToken);
      }
      return NextResponse.json({
        success: true,
        orderId: order.id,
        redirectUrl: `/checkout/success?${params.toString()}`,
      });
    }

    const sessionUser = await getSessionUser();
    if (sessionUser && !order.userId) {
      await linkGuestOrdersToUser(sessionUser.uid, order.email);
    }

    const demoPaymentId = `demo_${Date.now()}`;
    const completed = await completeOrderPayment({
      orderId: order.id,
      razorpayPaymentId: demoPaymentId,
      razorpayOrderId: order.razorpayOrderId,
      source: "client_verify",
    });

    const params = new URLSearchParams({
      orderId: completed.order.id,
    });
    if (completed.order.trackingToken) {
      params.set("trackingToken", completed.order.trackingToken);
    }

    return NextResponse.json({
      success: true,
      orderId: completed.order.id,
      paymentStatus: completed.order.paymentStatus,
      order: completed.order,
      redirectUrl: `/checkout/success?${params.toString()}`,
    });
  } catch (error) {
    const message = formatCheckoutError(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
