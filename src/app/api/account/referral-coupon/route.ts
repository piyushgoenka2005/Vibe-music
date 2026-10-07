import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import {
  generateReferralCoupon,
  getCouponShareUrl,
  getReferralCouponForUser,
} from "@/lib/server/couponService";

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.uid || !sessionUser.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let coupon = await getReferralCouponForUser(sessionUser.uid);
  if (!coupon) {
    coupon = await generateReferralCoupon({
      ownerUserId: sessionUser.uid,
      ownerEmail: sessionUser.email,
      ownerName: sessionUser.name ?? undefined,
    });
  }

  return NextResponse.json({
    coupon: {
      code: coupon.code,
      label: coupon.label,
      type: coupon.type,
      value: coupon.value,
      maxUsesPerUser: coupon.maxUsesPerUser,
      usedCount: coupon.usedCount,
      isActive: coupon.isActive,
    },
    shareUrl: getCouponShareUrl(coupon),
  });
}
