import { NextResponse } from "next/server";
import { traceRouteHandler } from "@/lib/api/traceRoute";
import { parseJsonBody, withApiGuards } from "@/lib/api/route-utils";
import { getSessionUser } from "@/lib/auth/server-session";
import { formatCheckoutError } from "@/lib/server/checkoutErrors";
import { attachPaidOrderToUser, verifyAndCompletePayment } from "@/lib/server/orderService";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { verifyPaymentSchema } from "@/lib/validations/checkout";
import { logInfo, logError } from "@/lib/server/logger";

async function postHandler(request: Request) {
  return withApiGuards(
    request,
    {
      context: "api/payment/verify-payment",
      scope: "checkout-verify-payment",
      rateLimit: RATE_LIMITS.checkout,
    },
    async () => {
      try {
        const parsed = await parseJsonBody(request, verifyPaymentSchema);
        if ("error" in parsed) return parsed.error;

        logInfo("Payment verification started", "api/payment/verify-payment", {
          razorpayOrderId: parsed.data.razorpayOrderId?.slice(0, 20),
        });

        const order = await verifyAndCompletePayment(parsed.data);

        logInfo("Payment verified successfully", "api/payment/verify-payment", {
          orderId: order.id,
          paymentStatus: order.paymentStatus,
        });

        const sessionUser = await getSessionUser();
        if (
          sessionUser?.email &&
          order.email.trim().toLowerCase() === sessionUser.email.trim().toLowerCase()
        ) {
          try {
            await attachPaidOrderToUser(order.id, sessionUser.uid, sessionUser.email);
            logInfo("Order attached to user", "api/payment/verify-payment", {
              orderId: order.id,
              userId: sessionUser.uid,
            });
          } catch (error) {
            logError("Failed to attach order to user", error, "api/payment/verify-payment", {
              orderId: order.id,
              userId: sessionUser.uid,
            });
            // Non-blocking: order is paid regardless of attachment
          }
        }

        return NextResponse.json({
          success: true,
          orderId: order.id,
          paymentStatus: order.paymentStatus,
          order,
        });
      } catch (error) {
        logError("Payment verification failed", error, "api/payment/verify-payment");
        const message = formatCheckoutError(error);
        const status = message.includes("Invalid") || message.includes("Missing") ? 400 : 500;
        return NextResponse.json({ error: message }, { status });
      }
    },
  );
}

export const POST = traceRouteHandler("POST /api/payment/verify-payment", postHandler);
