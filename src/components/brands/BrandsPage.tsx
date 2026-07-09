"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import type { BrandWithCount } from "@/lib/server/brandsPageLoader";
import "@/components/category/category.css";

interface BrandsPageProps {
  brands: BrandWithCount[];
}

export default function BrandsPage({ brands }: BrandsPageProps) {
  return (
    <main className="storefront-page storefront-page--subtle brands-page">
      <header className="storefront-page__header">
        <p className="storefront-page__eyebrow">Shop by brand</p>
        <h1 className="storefront-page__title">Brands</h1>
        <p className="storefront-page__meta">
          Browse {brands.length} brands stocked at Vibe Music.
        </p>
      </header>

      <ul className="cat-product-grid cat-product-grid--grid brands-page__grid">
        {brands.map((brand) => (
          <li key={brand.id}>
            <Link
              href={`${ROUTES.searchResults}?brand=${encodeURIComponent(brand.slug)}`}
              className="cat-product-card brands-page__card"
            >
              <span className="brands-page__name">{brand.name}</span>
              <span className="brands-page__count">
                {brand.productCount} {brand.productCount === 1 ? "product" : "products"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
