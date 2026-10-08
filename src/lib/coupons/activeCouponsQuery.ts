import type { QueryClient } from "@tanstack/react-query";
import type { StorefrontCouponOffer } from "@/types/coupon";

export const ACTIVE_COUPONS_QUERY_ROOT = "active-coupons";

/** Poll interval for live admin coupon updates (ms). */
export const ACTIVE_COUPONS_REFETCH_MS = 15_000;

/** Keep storefront coupon lists fresh without stale cached offers. */
export const activeCouponsQueryOptions = {
  staleTime: 0,
  gcTime: 60_000,
  refetchInterval: ACTIVE_COUPONS_REFETCH_MS,
  refetchIntervalInBackground: false,
  refetchOnMount: true,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  retry: 2,
} as const;

export const MAX_ACTIVE_COUPON_PRODUCT_IDS = 50;

export async function fetchActiveCoupons(
  params: {
    productId?: string;
    productIds?: string[];
  },
  signal?: AbortSignal,
): Promise<StorefrontCouponOffer[]> {
  const search = new URLSearchParams();
  if (params.productId) {
    search.set("productId", params.productId);
  }
  if (params.productIds?.length) {
    search.set("productIds", params.productIds.join(","));
  }

  const res = await fetch(`/api/coupons/active?${search.toString()}`, {
    cache: "no-store",
    signal,
  });
  if (!res.ok) throw new Error("Failed to load active coupons");
  const payload = (await res.json()) as { coupons?: StorefrontCouponOffer[] };
  return payload.coupons ?? [];
}

export function normalizeProductIds(productIds: string[]): string[] {
  return [...new Set(productIds.map((id) => id.trim()).filter(Boolean))].sort();
}

/** Call after admin coupon create/update/delete so storefront lists refresh immediately. */
export function invalidateActiveCouponsQueries(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: [ACTIVE_COUPONS_QUERY_ROOT] });
}
