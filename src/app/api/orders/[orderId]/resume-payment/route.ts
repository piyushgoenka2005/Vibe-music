import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getSessionUser } from "@/lib/auth/server-session";
import { getAdminSession } from "@/lib/server/adminService";
import { enforceRateLimit } from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { formatCheckoutError } from "@/lib/server/checkoutErrors";
import {
  getRazorpayPublicKey,
  isDemoPaymentsAllowed,
  isRazorpayConfigured,
} from "@/lib/server/env";
import { canAccessOrder } from "@/lib/server/orderAccess";
import { getOrderById } from "@/lib/server/orderService";
import { toPaise } from "@/lib/gstCalculator";
import { updateOrder } from "@/lib/server/orderRepository";
import { resumePaymentSchema } from "@/lib/validations/checkout";

export async function POST(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const rateLimited = await enforceRateLimit(request, "resume-payment", RATE_LIMITS.checkout);
    if (rateLimited) return rateLimited;

    const { orderId } = await context.params;
    const raw = await request.json().catch(() => ({}));
    const parsed = resumePaymentSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request body" },
        { status: 400 }
      );
    }
    const guestEmail = parsed.data.email?.trim().toLowerCase();
    const trackingToken = parsed.data.trackingToken;

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
        email: guestEmail ?? sessionUser?.email?.toLowerCase() ?? undefined,
        trackingToken,
      });

    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    if (order.paymentStatus === "paid") {
      const params = new URLSearchParams({ orderId: order.id, email: order.email });
      if (order.trackingToken) {
        params.set("trackingToken", order.trackingToken);
      }
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

    await updateOrder(order.id, {
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
