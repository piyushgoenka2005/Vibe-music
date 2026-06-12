import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { listCoupons, createCoupon } from "@/lib/server/couponService";
import { adminCouponSchema } from "@/lib/validations/admin";

export async function GET() {
  try {
    await requireAdmin("coupons:read");
    const coupons = await listCoupons();
    return NextResponse.json({ coupons });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin("coupons:write");
    const body = await request.json();
    const parsed = adminCouponSchema.parse(body);
    const coupon = await createCoupon({ ...parsed, isActive: parsed.isActive ?? true });
    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
