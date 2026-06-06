"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProductDetail } from "@/services/product.service";

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProductDetail(slug),
    enabled: Boolean(slug),
  });
}
