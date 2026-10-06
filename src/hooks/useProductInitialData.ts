"use client";

import { useEffect, useState } from "react";
import { fetchProductDetail, type ProductDetailResult } from "@/services/product.service";

function needsMerchandising(data: ProductDetailResult | null | undefined): boolean {
  if (!data?.product) return false;

  return (
    data.similarProducts.length === 0 &&
    data.relatedProducts.length === 0 &&
    data.frequentlyBoughtTogether.length === 0
  );
}

/** SSR-safe product data hook — avoids React Query when server passes initialData. */
export function useProductInitialData(slug: string, initialData: ProductDetailResult) {
  const [data, setData] = useState(initialData);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!slug || !needsMerchandising(initialData)) {
      return;
    }

    let cancelled = false;

    const run = () => {
      void fetchProductDetail(slug)
        .then((next) => {
          if (!cancelled) {
            setData(next);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setIsError(true);
          }
        });
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(run, { timeout: 2500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = window.setTimeout(run, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [initialData, slug]);

  return { data, isLoading: false, isError };
}
