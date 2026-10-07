import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { duplicateCoupon, getCouponShareUrl } from "@/lib/server/couponService";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireAdmin("coupons:write", request);
    const { id } = await context.params;
    const coupon = await duplicateCoupon(id);
    return NextResponse.json({
      coupon,
      shareUrl: getCouponShareUrl(coupon),
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
