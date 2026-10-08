"use client";

import { useEffect, useMemo } from "react";
import type { CouponLineInput } from "@/store/cartStore";
import { useCartStore } from "@/store/cartStore";
import type { StorefrontCouponOffer } from "@/types/coupon";

interface UseAppliedCouponSyncOptions {
  lineItems: CouponLineInput[];
  activeCoupons: StorefrontCouponOffer[] | null;
  isLoadingActiveCoupons: boolean;
  isActiveCouponsError: boolean;
}

export function useAppliedCouponSync({
  lineItems,
  activeCoupons,
  isLoadingActiveCoupons,
  isActiveCouponsError,
}: UseAppliedCouponSyncOptions) {
  const couponCode = useCartStore((s) => s.couponCode);
  const reconcileAppliedCoupon = useCartStore((s) => s.reconcileAppliedCoupon);

  const lineItemsKey = useMemo(() => JSON.stringify(lineItems), [lineItems]);
  const activeCodesKey = useMemo(
    () =>
      (activeCoupons ?? [])
        .map((coupon) => coupon.code)
        .sort()
        .join(","),
    [activeCoupons],
  );

  useEffect(() => {
    if (!couponCode) return;

    void reconcileAppliedCoupon(lineItems, {
      activeCoupons: isActiveCouponsError ? null : activeCoupons,
      activeCouponsReady: !isLoadingActiveCoupons && !isActiveCouponsError,
    });
  }, [
    couponCode,
    lineItemsKey,
    activeCodesKey,
    isLoadingActiveCoupons,
    isActiveCouponsError,
    reconcileAppliedCoupon,
    lineItems,
    activeCoupons,
  ]);
}
