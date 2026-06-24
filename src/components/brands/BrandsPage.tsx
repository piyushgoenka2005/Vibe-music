"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import type { BrandWithCount } from "@/lib/server/brandsPageLoader";

interface BrandsPageProps {
  brands: BrandWithCount[];
}

export default function BrandsPage({ brands }: BrandsPageProps) {
  return (
    <main className="storefront-page storefront-page--subtle">
      <header className="storefront-page__header">
        <p className="storefront-page__eyebrow">Shop by brand</p>
        <h1 className="storefront-page__title">Brands</h1>
        <p className="storefront-page__meta">
          Browse {brands.length} brands stocked at Vibe Music.
        </p>
      </header>

      <ul
        className="cat-grid cat-grid--grid"
        style={{ listStyle: "none", padding: 0, margin: 0 }}
      >
        {brands.map((brand) => (
          <li key={brand.id}>
            <Link
              href={`${ROUTES.searchResults}?brand=${encodeURIComponent(brand.slug)}`}
              className="cat-product-card"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                minHeight: "8rem",
                padding: "1.5rem",
                textDecoration: "none",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: "1.125rem" }}>{brand.name}</span>
              <span style={{ color: "var(--color-text-muted, #666)", marginTop: "0.25rem" }}>
                {brand.productCount} {brand.productCount === 1 ? "product" : "products"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
