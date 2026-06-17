import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/auth/require-admin";
import { updateCoupon, deleteCoupon } from "@/lib/server/couponService";
import { adminCouponSchema } from "@/lib/validations/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAdmin("coupons:write", request);
    const { id } = await context.params;
    const body = await request.json();
    const parsed = adminCouponSchema.partial().parse(body);
    const coupon = await updateCoupon(id, parsed);
    return NextResponse.json({ coupon });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin("coupons:delete", _request);
    const { id } = await context.params;
    await deleteCoupon(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
