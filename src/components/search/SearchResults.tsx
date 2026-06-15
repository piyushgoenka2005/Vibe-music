"use client";

import Link from "next/link";
import { formatCurrency } from "@/utils/currency";
import { productPath } from "@/lib/routes";
import { searchStore } from "@/store/searchStore";
import type { SearchProduct } from "@/types/search";

interface SearchResultsProps {
  query: string;
  products: SearchProduct[];
}

export default function SearchResults({ query, products }: SearchResultsProps) {
  if (products.length === 0) return null;

  return (
    <div className="sw-search-results-list" role="list" aria-label="Search results">
      {products.map((product) => (
        <article
          key={product.id}
          className="sw-search-result-card"
          role="listitem"
        >
          <Link
            href={productPath(product.slug)}
            className="sw-search-result-card__link"
            onClick={() =>
              searchStore.trackSearchClick({
                query,
                productId: product.id,
                productSlug: product.slug,
                productName: product.name,
                source: "results-page",
              })
            }
          >
            <div>
              <div className="sw-search-result-card__brand">{product.brand}</div>
              <h3 className="sw-search-result-card__name">{product.name}</h3>
              <p className="sw-search-result-card__category">{product.category}</p>
            </div>
            <div className="sw-search-result-card__price">
              {formatCurrency(product.price)}
            </div>
          </Link>
        </article>
      ))}
    </div>
  );
}
