"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SearchX } from "lucide-react";
import ProductCard from "@/components/common/ProductCard";
import { fetchProducts } from "@/services/products.api";
import { ROUTES } from "@/lib/routes";
import type { Product } from "@/types/product";
import "@/components/category/category.css";

interface SearchEmptyStateProps {
  query: string;
}

const BROWSE_LINKS = [
  { label: "Guitars", href: `${ROUTES.searchResults}?q=guitars` },
  { label: "Studio", href: `${ROUTES.searchResults}?q=studio` },
  { label: "Keys", href: `${ROUTES.searchResults}?q=keyboards` },
  { label: "Drums", href: `${ROUTES.searchResults}?q=drums` },
  { label: "Deals", href: `${ROUTES.searchResults}?q=deals` },
] as const;

const SEARCH_TIPS = [
  "Check your spelling",
  "Use fewer or broader keywords",
  "Try a brand or category name",
] as const;

export default function SearchEmptyState({ query }: SearchEmptyStateProps) {
  const [recommended, setRecommended] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetchProducts({ limit: 8 })
      .then((products) => {
        if (!cancelled) setRecommended(products);
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
      <div className="sw-search-empty__hero">
        <div className="sw-search-empty__icon" aria-hidden="true">
          <SearchX size={28} strokeWidth={1.75} />
        </div>
        <h2 className="sw-search-empty__title">
          No results for &ldquo;{query}&rdquo;
        </h2>
        <p className="sw-search-empty__lead">
          We couldn&apos;t find a match. Try adjusting your search or explore
          popular categories below.
        </p>
        <ul className="sw-search-empty__tips">
          {SEARCH_TIPS.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>

      <div className="sw-search-empty__browse">
        <p className="sw-search-empty__browse-label">Popular searches</p>
        <div className="sw-search-empty__chips">
          {BROWSE_LINKS.map((link) => (
            <Link key={link.label} href={link.href} className="sw-search-empty__chip">
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {recommended.length > 0 ? (
        <section className="sw-search-empty__recommended" aria-label="Recommended products">
          <header className="sw-search-empty__section-head">
            <p className="sw-search-empty__section-eyebrow">Curated picks</p>
            <h3 className="sw-search-empty__section-title">Recommended for you</h3>
          </header>
          <div className="cat-product-grid cat-product-grid--grid">
            {recommended.map((product, index) => (
              <ProductCard key={product.id} product={product} view="grid" eager={index < 4} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
