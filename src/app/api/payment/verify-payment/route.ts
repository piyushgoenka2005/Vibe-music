import { NextResponse } from "next/server";
import { traceRouteHandler } from "@/lib/api/traceRoute";
import { parseJsonBody, withApiGuards } from "@/lib/api/route-utils";
import { getSessionUser } from "@/lib/auth/server-session";
import { formatCheckoutError } from "@/lib/server/checkoutErrors";
import { attachPaidOrderToUser, verifyAndCompletePayment } from "@/lib/server/orderService";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { verifyPaymentSchema } from "@/lib/validations/checkout";

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

        const order = await verifyAndCompletePayment(parsed.data);

        const sessionUser = await getSessionUser();
        if (
          sessionUser?.email &&
          order.email.trim().toLowerCase() === sessionUser.email.trim().toLowerCase()
        ) {
          await attachPaidOrderToUser(order.id, sessionUser.uid, sessionUser.email).catch(
            () => undefined,
          );
        }

        return NextResponse.json({
          success: true,
          orderId: order.id,
          paymentStatus: order.paymentStatus,
          order,
        });
      } catch (error) {
        const message = formatCheckoutError(error);
        const status = message.includes("Invalid") || message.includes("Missing") ? 400 : 500;
        return NextResponse.json({ error: message }, { status });
      }
    },
  );
}

export const POST = traceRouteHandler("POST /api/payment/verify-payment", postHandler);
