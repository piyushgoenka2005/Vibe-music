import { NextResponse } from "next/server";
import { enforceRateLimit, handleRouteError, parseJsonBody } from "@/lib/api/route-utils";
import { getSessionUser } from "@/lib/auth/server-session";
import { validateCoupon } from "@/lib/server/couponService";
import { validateCouponBodySchema } from "@/lib/validations/coupon";
import type { CouponValidationResult } from "@/types/coupon";
import { RATE_LIMITS } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(request, "coupons-validate", RATE_LIMITS.search);
    if (rateLimited) return rateLimited;

    const [sessionUser, parsed] = await Promise.all([
      getSessionUser(),
      parseJsonBody(request, validateCouponBodySchema),
    ]);
    if ("error" in parsed) return parsed.error;

    const result: CouponValidationResult = await validateCoupon(
      parsed.data.code,
      parsed.data.subtotal,
      parsed.data.items,
      {
        userId: sessionUser?.uid,
        customerEmail: parsed.data.customerEmail ?? sessionUser?.email,
      },
    );

    if (!result.valid) {
      return NextResponse.json({ result }, { status: 400 });
    }

    return NextResponse.json({ result });
  } catch (error) {
    return handleRouteError(error, "api/coupons/validate");
  }
}
