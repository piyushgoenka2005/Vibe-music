import { randomUUID } from "crypto";
import * as pg from "@/lib/server/prisma/contentRepository";
import type { Coupon } from "@/types/admin";
import type { AppliedCouponSnapshot, CouponValidationResult } from "@/types/coupon";
import { validateCouponForSubtotal } from "@/lib/coupons/couponMath";

const STATIC_COUPONS: Record<string, Omit<Coupon, "id">> = {
  SAVE10: {
    code: "SAVE10",
    label: "10% off",
    type: "percentage",
    value: 10,
    usedCount: 0,
    isActive: true,
    createdAt: "",
    updatedAt: "",
  },
  SWEET15: {
    code: "SWEET15",
    label: "15% off",
    type: "percentage",
    value: 15,
    usedCount: 0,
    isActive: true,
    createdAt: "",
    updatedAt: "",
  },
  GEAR20: {
    code: "GEAR20",
    label: "20% off",
    type: "percentage",
    value: 20,
    usedCount: 0,
    isActive: true,
    createdAt: "",
    updatedAt: "",
  },
};

function staticCoupon(code: string): Coupon | null {
  const normalized = code.toUpperCase();
  const template = STATIC_COUPONS[normalized];
  if (!template) return null;
  return {
    ...template,
    id: `static-${normalized}`,
    code: normalized,
  };
}

async function seedDefaultCoupons(): Promise<Coupon[]> {
  const now = new Date().toISOString();
  const defaults: Omit<Coupon, "id">[] = [
    {
      code: "SAVE10",
      label: "10% off",
      type: "percentage",
      value: 10,
      usedCount: 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      code: "SWEET15",
      label: "15% off",
      type: "percentage",
      value: 15,
      usedCount: 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      code: "GEAR20",
      label: "20% off",
      type: "percentage",
      value: 20,
      usedCount: 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const coupons: Coupon[] = [];
  for (const coupon of defaults) {
    const record = { ...coupon, id: randomUUID() };
    await pg.createCouponRecord(record);
    coupons.push(record);
  }
  return coupons;
}

export async function listCoupons(
  options: { limit?: number; cursor?: string } = {}
): Promise<{
  coupons: Coupon[];
  hasMore: boolean;
  nextCursor?: string;
}> {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  let coupons = await pg.listCoupons();

  if (coupons.length === 0) {
    coupons = await seedDefaultCoupons();
  }

  if (options.cursor) {
    const index = coupons.findIndex((coupon) => coupon.id === options.cursor);
    if (index >= 0) coupons = coupons.slice(index + 1);
  }

  const page = coupons.slice(0, limit + 1);
  const hasMore = page.length > limit;
  const items = page.slice(0, limit);

  return {
    coupons: items,
    hasMore,
    nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!.id : undefined,
  };
}

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const normalized = code.toUpperCase();
  const coupon = await pg.getCouponByCode(normalized);
  return coupon ?? staticCoupon(normalized);
}

export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<CouponValidationResult> {
  const coupon = await getCouponByCode(code);
  if (!coupon) {
    return { valid: false, discount: 0, error: "Invalid coupon code" };
  }

  const outcome = validateCouponForSubtotal(coupon, subtotal);
  if (!outcome.valid) {
    return { valid: false, discount: 0, error: outcome.error };
  }

  const snapshot: AppliedCouponSnapshot = {
    code: coupon.code,
    label: coupon.label,
    type: coupon.type,
    value: coupon.value,
    minOrderAmount: coupon.minOrderAmount,
  };

  return {
    valid: true,
    discount: outcome.discount,
    coupon: snapshot,
  };
}

export async function createCoupon(
  input: Omit<Coupon, "id" | "usedCount" | "createdAt" | "updatedAt">
): Promise<Coupon> {
  const now = new Date().toISOString();
  const record: Coupon = {
    ...input,
    id: randomUUID(),
    code: input.code.toUpperCase(),
    usedCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  return pg.createCouponRecord(record);
}

export async function updateCoupon(
  id: string,
  patch: Partial<Coupon>
): Promise<Coupon> {
  return pg.updateCouponRecord(id, patch);
}

export async function deleteCoupon(id: string): Promise<void> {
  await pg.deleteCouponRecord(id);
}

export async function incrementCouponUsage(code: string): Promise<void> {
  await pg.incrementCouponUsageRecord(code);
}
