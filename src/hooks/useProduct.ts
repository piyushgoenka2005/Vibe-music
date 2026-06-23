"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProductDetail, type ProductDetailResult } from "@/services/product.service";

function needsMerchandising(data: ProductDetailResult | null | undefined): boolean {
  if (!data?.product) return false;
  return (
    data.similarProducts.length === 0 &&
    data.relatedProducts.length === 0 &&
    data.frequentlyBoughtTogether.length === 0
  );
}

export function useProduct(slug: string, initialData?: ProductDetailResult | null) {
  const queryClient = useQueryClient();
  const hasInitialProduct = Boolean(initialData?.product);

  const query = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProductDetail(slug),
    enabled: Boolean(slug) && !hasInitialProduct,
    initialData: hasInitialProduct ? initialData! : undefined,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (!slug || !hasInitialProduct || !needsMerchandising(initialData)) {
      return;
    }

    let cancelled = false;

    const run = () => {
      void fetchProductDetail(slug).then((full) => {
        if (cancelled || !full) return;
        queryClient.setQueryData(["product", slug], full);
      });
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(run, { timeout: 2500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timer = window.setTimeout(run, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [slug, hasInitialProduct, initialData, queryClient]);

  return query;
}
