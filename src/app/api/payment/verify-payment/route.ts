import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { formatCheckoutError } from "@/lib/server/checkoutErrors";
import {
  linkGuestOrdersToUser,
  verifyAndCompletePayment,
} from "@/lib/server/orderService";
import {
  enforceMutationSecurity,
  enforceRateLimit,
} from "@/lib/api/route-utils";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import type { VerifyPaymentPayload } from "@/types/order";

export async function POST(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(
      request,
      "checkout-verify-payment",
      RATE_LIMITS.checkout
    );
    if (rateLimited) return rateLimited;

    const csrfError = enforceMutationSecurity(request);
    if (csrfError) return csrfError;

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

    const sessionUser = await getSessionUser();
    if (sessionUser?.email) {
      void linkGuestOrdersToUser(
        sessionUser.uid,
        sessionUser.email
      ).catch(() => undefined);
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      paymentStatus: order.paymentStatus,
      order,
    });
  } catch (error) {
    const message = formatCheckoutError(error);
    const status = message.includes("Invalid") || message.includes("Missing")
      ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
