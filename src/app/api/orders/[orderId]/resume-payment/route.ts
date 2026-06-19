import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getSessionUser } from "@/lib/auth/server-session";
import { getAdminSession } from "@/lib/server/adminService";
import { formatCheckoutError } from "@/lib/server/checkoutErrors";
import {
  getRazorpayPublicKey,
  isDemoPaymentsAllowed,
  isRazorpayConfigured,
} from "@/lib/server/env";
import { canAccessOrder } from "@/lib/server/orderAccess";
import { getOrderById } from "@/lib/server/orderService";
import { toPaise } from "@/lib/gstCalculator";
import { getAdminFirestore } from "@/lib/firebase/admin";

export async function POST(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
    };
    const guestEmail = body.email?.trim().toLowerCase();

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const sessionUser = await getSessionUser();
    const adminSession = sessionUser
      ? await getAdminSession(sessionUser.uid)
      : null;

    const hasAccess =
      Boolean(adminSession) ||
      canAccessOrder(order, {
        userId: sessionUser?.uid,
        email: guestEmail ?? sessionUser?.email?.toLowerCase(),
      });

    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    if (order.paymentStatus === "paid") {
      const params = new URLSearchParams({ orderId: order.id, email: order.email });
      return NextResponse.json(
        {
          error: "This order is already paid.",
          redirectUrl: `/checkout/success?${params.toString()}`,
        },
        { status: 400 }
      );
    }

    if (order.paymentStatus !== "pending") {
      return NextResponse.json(
        { error: "Payment cannot be resumed for this order." },
        { status: 400 }
      );
    }

    if (order.paymentMethod === "cod") {
      return NextResponse.json(
        { error: "This is a cash-on-delivery order." },
        { status: 400 }
      );
    }

    if (!isRazorpayConfigured()) {
      if (!isDemoPaymentsAllowed()) {
        return NextResponse.json(
          { error: "Payment gateway unavailable." },
          { status: 503 }
        );
      }

      return NextResponse.json({
        orderId: order.id,
        email: order.email,
        demoMode: true,
      });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: toPaise(order.total),
      currency: "INR",
      receipt: order.id,
      notes: {
        email: order.email,
        orderId: order.id,
        resumed: "true",
      },
    });

    const db = getAdminFirestore();
    await db.collection("orders").doc(order.id).update({
      razorpayOrderId: razorpayOrder.id,
      updatedAt: new Date().toISOString(),
    });

    const keyId = getRazorpayPublicKey();
    if (!keyId) {
      return NextResponse.json(
        { error: "Payment gateway is misconfigured." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      orderId: order.id,
      email: order.email,
      demoMode: false,
      razorpay: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId,
      },
      shipping: {
        name: order.shippingAddress.name,
        email: order.email,
        phone: order.customerPhone ?? order.shippingAddress.phone,
      },
    });
  } catch (error) {
    const message = formatCheckoutError(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
