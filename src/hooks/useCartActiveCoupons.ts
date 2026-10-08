"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ACTIVE_COUPONS_QUERY_ROOT,
  activeCouponsQueryOptions,
  fetchActiveCoupons,
  MAX_ACTIVE_COUPON_PRODUCT_IDS,
  normalizeProductIds,
} from "@/lib/coupons/activeCouponsQuery";

export function useCartActiveCoupons(productIds: string[]) {
  const normalizedIds = useMemo(
    () => normalizeProductIds(productIds).slice(0, MAX_ACTIVE_COUPON_PRODUCT_IDS),
    [productIds],
  );
  const queryKey = normalizedIds.join(",");

  const query = useQuery({
    queryKey: [ACTIVE_COUPONS_QUERY_ROOT, "lines", queryKey],
    queryFn: ({ signal }) => fetchActiveCoupons({ productIds: normalizedIds }, signal),
    enabled: normalizedIds.length > 0,
    ...activeCouponsQueryOptions,
  });

  return {
    coupons: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
  };
}
