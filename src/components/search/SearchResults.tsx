"use client";

import type { SearchProduct } from "@/types/search";

interface SearchResultsProps {
  products: SearchProduct[];
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export default function SearchResults({ products }: SearchResultsProps) {
  if (products.length === 0) return null;

  return (
    <div className="sw-search-results-list" role="list" aria-label="Search results">
      {products.map((product) => (
        <article
          key={product.id}
          className="sw-search-result-card"
          role="listitem"
        >
          <div>
            <div className="sw-search-result-card__brand">{product.brand}</div>
            <h3 className="sw-search-result-card__name">{product.name}</h3>
            <p className="sw-search-result-card__category">{product.category}</p>
          </div>
          <div className="sw-search-result-card__price">
            {formatPrice(product.price)}
          </div>
        </article>
      ))}
    </div>
  );
}
