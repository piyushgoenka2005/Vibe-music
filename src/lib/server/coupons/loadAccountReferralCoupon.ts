import "server-only";

import type { SessionUser } from "@/lib/auth/server-session";
import type { Coupon } from "@/types/admin";
import type { AccountReferralPayload } from "@/types/accountReferral";
import {
  generateReferralCoupon,
  getCouponShareUrl,
  getReferralCouponForUser,
} from "@/lib/server/coupons/couponService";

export type { AccountReferralPayload };

function serializeReferralCoupon(coupon: Coupon): AccountReferralPayload {
  return {
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
  };
}

/** Load or create the signed-in customer's referral coupon. */
export async function loadAccountReferralCoupon(
  sessionUser: SessionUser | null,
): Promise<AccountReferralPayload | null> {
  if (!sessionUser?.uid || !sessionUser.email) {
    return null;
  }

  try {
    let coupon = await getReferralCouponForUser(sessionUser.uid);
    if (!coupon) {
      coupon = await generateReferralCoupon({
        ownerUserId: sessionUser.uid,
        ownerEmail: sessionUser.email,
        ownerName: sessionUser.name ?? undefined,
      });
    }
    return serializeReferralCoupon(coupon);
  } catch (error) {
    console.error("[loadAccountReferralCoupon]", error);
    return null;
  }
}
