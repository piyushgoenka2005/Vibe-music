"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ACTIVE_COUPONS_QUERY_ROOT,
  activeCouponsQueryOptions,
  fetchActiveCoupons,
  normalizeProductIds,
} from "@/lib/coupons/activeCouponsQuery";

export function useCartActiveCoupons(productIds: string[]) {
  const normalizedIds = useMemo(() => normalizeProductIds(productIds), [productIds]);
  const queryKey = normalizedIds.join(",");

  const query = useQuery({
    queryKey: [ACTIVE_COUPONS_QUERY_ROOT, "lines", queryKey],
    queryFn: () => fetchActiveCoupons({ productIds: normalizedIds }),
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
