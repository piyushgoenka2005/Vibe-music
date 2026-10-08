import type { QueryClient } from "@tanstack/react-query";
import type { StorefrontCouponOffer } from "@/types/coupon";

export const ACTIVE_COUPONS_QUERY_ROOT = "active-coupons";

/** Keep storefront coupon lists fresh — admin edits should show quickly everywhere. */
export const activeCouponsQueryOptions = {
  staleTime: 0,
  gcTime: 60_000,
  refetchInterval: 15_000,
  refetchIntervalInBackground: true,
  refetchOnMount: true,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
} as const;

export async function fetchActiveCoupons(params: {
  productId?: string;
  productIds?: string[];
}): Promise<StorefrontCouponOffer[]> {
  const search = new URLSearchParams();
  if (params.productId) {
    search.set("productId", params.productId);
  }
  if (params.productIds?.length) {
    search.set("productIds", params.productIds.join(","));
  }

  const res = await fetch(`/api/coupons/active?${search.toString()}`, {
    cache: "no-store",
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
