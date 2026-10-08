"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ACTIVE_COUPONS_QUERY_ROOT,
  activeCouponsQueryOptions,
  fetchActiveCoupons,
} from "@/lib/coupons/activeCouponsQuery";

export function useProductActiveCoupons(productId: string) {
  const query = useQuery({
    queryKey: [ACTIVE_COUPONS_QUERY_ROOT, "product", productId],
    queryFn: () => fetchActiveCoupons({ productId }),
    enabled: Boolean(productId),
    ...activeCouponsQueryOptions,
  });

  const coupons = query.data ?? null;

  return {
    coupons,
    primaryCoupon: coupons?.[0] ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.isError,
  };
}
