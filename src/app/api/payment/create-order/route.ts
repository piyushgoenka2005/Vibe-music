import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { formatCheckoutError } from "@/lib/server/checkoutErrors";
import { createOrder } from "@/lib/server/orderService";
import { sendOrderConfirmationEmail } from "@/lib/server/orderEmailService";
import {
  resolveCouponDiscount,
  resolveOrderItemsFromFirestore,
} from "@/lib/server/orderValidation";
import { toPaise } from "@/lib/gstCalculator";
import {
  enforceMutationSecurity,
  enforceRateLimit,
} from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import type { CreateOrderPayload } from "@/types/order";

export async function POST(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(
      request,
      "checkout-create-order",
      RATE_LIMITS.checkout
    );
    if (rateLimited) return rateLimited;

    const csrfError = enforceMutationSecurity(request);
    if (csrfError) return csrfError;

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

    const resolvedItems = await resolveOrderItemsFromFirestore(body.items);
    const subtotal = resolvedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const couponDiscount = await resolveCouponDiscount(body.couponCode, subtotal);

    const payload: CreateOrderPayload = {
      ...body,
      items: resolvedItems,
      email: body.email.trim().toLowerCase(),
      customerName: body.customerName?.trim() || body.shippingAddress.name?.trim(),
      customerPhone:
        body.customerPhone?.trim() || body.shippingAddress.phone?.trim(),
      buyerState: body.buyerState || body.shippingAddress.state,
      couponDiscount,
    };

    const { order, razorpayOrderId, keyId, demoMode } = await createOrder(
      payload,
      sessionUser?.uid
    );

    if (payload.paymentMethod === "cod") {
      void sendOrderConfirmationEmail(order);
      return NextResponse.json({ orderId: order.id, order });
    }

    if (demoMode) {
      return NextResponse.json({
        orderId: order.id,
        demoMode: true,
      });
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
    const message = formatCheckoutError(error);
    const status = /Insufficient stock|Cart is empty|required|Invalid payment method/i.test(
      message
    )
      ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
