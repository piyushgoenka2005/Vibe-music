"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchProducts } from "@/services/products.api";
import { productPath } from "@/lib/routes";
import { formatCurrency } from "@/utils/currency";
import type { SearchProduct } from "@/types/search";

interface SearchEmptyStateProps {
  query: string;
}

export default function SearchEmptyState({ query }: SearchEmptyStateProps) {
  const [recommended, setRecommended] = useState<SearchProduct[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetchProducts({ limit: 8 })
      .then((products) => {
        if (cancelled) return;
        setRecommended(
          products.map((product) => ({
            id: product.id,
            slug: product.slug,
            name: product.name,
            brand: product.brand,
            category: product.category,
            price: product.price,
          }))
        );
      })
      .catch(() => {
        if (!cancelled) setRecommended([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="sw-search-empty">
      <h2>No results found for &ldquo;{query}&rdquo;</h2>
      <p>
        Try checking your spelling, using fewer keywords, or browsing our
        recommended products below.
      </p>

      {recommended.length > 0 ? (
        <section aria-label="Recommended products">
          <h3 className="sw-search-empty__section-title">Recommended for you</h3>
          <div className="sw-search-recommended">
            {recommended.map((product) => (
              <Link
                key={product.id}
                href={productPath(product.slug)}
                className="sw-search-recommended__card"
              >
                <div className="sw-search-recommended__brand">{product.brand}</div>
                <div className="sw-search-recommended__name">{product.name}</div>
                <div className="sw-search-recommended__price">
                  {formatCurrency(product.price)}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
