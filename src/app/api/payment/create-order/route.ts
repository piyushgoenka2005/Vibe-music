import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { formatCheckoutError } from "@/lib/server/checkoutErrors";
import { createOrder } from "@/lib/server/orderService";
import { isPlacedOrder } from "@/lib/orderPlacement";
import { sendOrderConfirmationEmail } from "@/lib/server/orderEmailService";
import { notifyCustomerOrderPlaced } from "@/lib/server/orderNotificationService";
import {
  resolveCouponDiscount,
  resolveOrderItems,
} from "@/lib/server/orderValidation";
import { toPaise } from "@/lib/gstCalculator";
import {
  enforceMutationSecurity,
  enforceRateLimit,
} from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import {
  logPayment,
  logPaymentError,
} from "@/lib/server/paymentDiagnostics";
import type { CreateOrderPayload } from "@/types/order";
import { evaluateCodEligibility } from "@/lib/server/codEligibility";

export async function POST(request: Request) {
  try {
    logPayment("Starting create order");

    const rateLimited = await enforceRateLimit(
      request,
      "checkout-create-order",
      RATE_LIMITS.checkout
    );
    if (rateLimited) {
      logPayment("Rate limited");
      return rateLimited;
    }

    const csrfError = enforceMutationSecurity(request);
    if (csrfError) {
      logPayment("CSRF/origin check failed");
      return csrfError;
    }

    const [sessionUser, body] = await Promise.all([
      getSessionUser(),
      request.json() as Promise<CreateOrderPayload>,
    ]);
    logPayment("Request parsed", {
      paymentMethod: body.paymentMethod,
      itemCount: body.items?.length ?? 0,
      hasEmail: Boolean(body.email?.trim()),
    });

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

    const resolvedItems = await resolveOrderItems(body.items);
    logPayment("Order items resolved", { count: resolvedItems.length });
    const subtotal = resolvedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const couponDiscount = await resolveCouponDiscount(body.couponCode, subtotal);
    const orderValue = Math.max(0, subtotal - couponDiscount);

    if (body.paymentMethod === "cod") {
      const codCheck = evaluateCodEligibility({
        orderValue,
        postalCode: body.shippingAddress?.postalCode,
      });
      if (!codCheck.eligible) {
        return NextResponse.json(
          { error: codCheck.reason ?? "Cash on delivery is not available" },
          { status: 400 }
        );
      }
    }

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
    logPayment("Order created", {
      orderId: order.id,
      paymentMethod: payload.paymentMethod,
      demoMode: Boolean(demoMode),
      hasRazorpayOrderId: Boolean(razorpayOrderId),
    });

    if (payload.paymentMethod === "cod" && isPlacedOrder(order)) {
      void sendOrderConfirmationEmail(order);
      void notifyCustomerOrderPlaced(order);
      return NextResponse.json({
        orderId: order.id,
        trackingToken: order.trackingToken,
        order,
      });
    }

    if (demoMode) {
      return NextResponse.json({
        orderId: order.id,
        trackingToken: order.trackingToken,
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
      trackingToken: order.trackingToken,
      razorpayOrderId,
      amount: toPaise(order.total),
      currency: "INR",
      keyId,
    });
  } catch (error) {
    logPaymentError(error, { step: "api/payment/create-order" });
    const message = formatCheckoutError(error);
    const status = /Insufficient stock|Cart is empty|required|Invalid payment method/i.test(
      message
    )
      ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
