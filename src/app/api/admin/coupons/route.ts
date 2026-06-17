import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { listCoupons, createCoupon } from "@/lib/server/couponService";
import { adminCouponSchema } from "@/lib/validations/admin";

export async function GET(request: Request) {
  try {
    await requireAdmin("coupons:read");
    const { searchParams } = new URL(request.url);
    const result = await listCoupons({
      limit: Number(searchParams.get("limit") ?? 20),
      cursor: searchParams.get("cursor") ?? undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin("coupons:write", request);
    const body = await request.json();
    const parsed = adminCouponSchema.parse(body);
    const coupon = await createCoupon({ ...parsed, isActive: parsed.isActive ?? true });
    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
