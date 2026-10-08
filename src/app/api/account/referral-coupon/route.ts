import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server-session";
import { loadAccountReferralCoupon } from "@/lib/server/coupons/loadAccountReferralCoupon";

export const dynamic = "force-dynamic";

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.uid || !sessionUser.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await loadAccountReferralCoupon(sessionUser);
  if (!payload) {
    return NextResponse.json({ error: "Unable to load referral coupon" }, { status: 500 });
  }

  return NextResponse.json(payload);
}
