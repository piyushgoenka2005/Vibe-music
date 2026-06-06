"use client";

import { getRecommendedProducts } from "@/services/search.service";

interface SearchEmptyStateProps {
  query: string;
}

export default function SearchEmptyState({ query }: SearchEmptyStateProps) {
  const recommended = getRecommendedProducts();

  return (
    <div className="sw-search-empty">
      <h2>No results found for &ldquo;{query}&rdquo;</h2>
      <p>
        Try checking your spelling, using fewer keywords, or browsing our
        recommended products below.
      </p>

      <section aria-label="Recommended products">
        <h3 style={{ margin: "0 0 12px", fontSize: 18, textAlign: "left" }}>
          Recommended for you
        </h3>
        <div className="sw-search-recommended">
          {recommended.map((product) => (
            <article key={product.id} className="sw-search-recommended__card">
              <div className="sw-search-recommended__brand">{product.brand}</div>
              <div className="sw-search-recommended__name">{product.name}</div>
              <div className="sw-search-recommended__price">
                ${product.price.toFixed(2)}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
