import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { generateReferralCoupon, getCouponShareUrl } from "@/lib/server/couponService";
import { adminGenerateReferralCouponSchema } from "@/lib/validations/admin";

export async function POST(request: Request) {
  try {
    await requireAdmin("coupons:write", request);
    const body = await request.json();
    const parsed = adminGenerateReferralCouponSchema.parse(body);
    const coupon = await generateReferralCoupon(parsed);
    return NextResponse.json({
      coupon,
      shareUrl: getCouponShareUrl(coupon),
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
