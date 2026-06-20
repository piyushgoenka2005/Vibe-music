"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProductDetail, type ProductDetailResult } from "@/services/product.service";

export function useProduct(slug: string, initialData?: ProductDetailResult | null) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProductDetail(slug),
    enabled: Boolean(slug),
    initialData: initialData ?? undefined,
    staleTime: 60_000,
  });
}
