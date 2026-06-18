import type { AppliedCouponSnapshot } from "@/types/coupon";

export function formatCouponLabel(coupon: Pick<AppliedCouponSnapshot, "label" | "type" | "value">): string {
  if (coupon.label.trim()) return coupon.label;
  if (coupon.type === "percentage") return `${coupon.value}% off`;
  return `₹${coupon.value} off`;
}
