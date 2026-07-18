"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Clock3, History } from "lucide-react";
import ProductCard from "@/components/common/ProductCard";
import { ROUTES } from "@/lib/routes";
import { fetchProductSummaries } from "@/services/products.api";
import { useRecentlyViewedStore } from "@/store/recentlyViewedStore";
import "@/components/category/category.css";

interface SearchRecentlyViewedProps {
  /** Compact layout for empty-results / nested placements. */
  compact?: boolean;
  className?: string;
}

export default function SearchRecentlyViewed({
  compact = false,
  className = "",
}: SearchRecentlyViewedProps) {
  const productIds = useRecentlyViewedStore((s) => s.productIds);
  const clear = useRecentlyViewedStore((s) => s.clear);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(useRecentlyViewedStore.persist.hasHydrated());
    return useRecentlyViewedStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
  }, []);

  const idsKey = useMemo(
    () => productIds.slice(0, 12).join(","),
    [productIds]
  );

  const { data: products = [], isLoading, isFetching } = useQuery({
    queryKey: ["search-recently-viewed", idsKey],
    queryFn: () => fetchProductSummaries(productIds.slice(0, 12)),
    enabled: hydrated && productIds.length > 0,
    staleTime: 60_000,
  });

  // Keep store order (most recently viewed first).
  const orderedProducts = useMemo(() => {
    if (products.length === 0) return [];
    const byId = new Map(products.map((product) => [product.id, product]));
    return productIds
      .map((id) => byId.get(id))
      .filter((product): product is NonNullable<typeof product> => Boolean(product));
  }, [productIds, products]);

  const loading = !hydrated || ((isLoading || isFetching) && productIds.length > 0);
  const hasItems = orderedProducts.length > 0;

  return (
    <section
      className={`sw-search-recent${compact ? " sw-search-recent--compact" : ""}${className ? ` ${className}` : ""}`}
      aria-label="Recently viewed products"
    >
      <header className="sw-search-recent__head">
        <div className="sw-search-recent__titles">
          <p className="sw-search-recent__eyebrow">
            <History size={14} strokeWidth={2.25} aria-hidden="true" />
            Continue browsing
          </p>
          <h2 className="sw-search-recent__title">Recently viewed</h2>
        </div>
        {hasItems ? (
          <button
            type="button"
            className="sw-search-recent__clear"
            onClick={() => clear()}
          >
            Clear history
          </button>
        ) : null}
      </header>

      {loading ? (
        <div className="sw-search-recent__loading" role="status" aria-live="polite">
          <div className="sw-search-recent__skeleton" aria-hidden="true" />
          <div className="sw-search-recent__skeleton" aria-hidden="true" />
          <div className="sw-search-recent__skeleton" aria-hidden="true" />
          <span className="sw-search-recent__loading-label">
            Loading recently viewed products
          </span>
        </div>
      ) : hasItems ? (
        <div
          className={`cat-product-grid cat-product-grid--grid sw-search-recent__grid`}
          role="list"
        >
          {orderedProducts.map((product) => (
            <ProductCard key={product.id} product={product} view="grid" />
          ))}
        </div>
      ) : (
        <div className="sw-search-recent__empty">
          <span className="sw-search-recent__empty-icon" aria-hidden="true">
            <Clock3 size={22} strokeWidth={1.75} />
          </span>
          <p className="sw-search-recent__empty-title">No recently viewed gear yet</p>
          <p className="sw-search-recent__empty-text">
            Open a product page and it will show up here so you can jump back
            quickly.
          </p>
          <Link href={ROUTES.home} className="sw-search-recent__empty-cta">
            Browse homepage
          </Link>
        </div>
      )}
    </section>
  );
}
