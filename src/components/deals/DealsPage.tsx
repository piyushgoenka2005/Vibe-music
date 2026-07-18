"use client";

import ProductCard from "@/components/common/ProductCard";
import StorefrontBackButton from "@/components/layout/StorefrontBackButton";
import type { Product } from "@/types/product";
import "@/components/category/category.css";

interface DealsPageProps {
  products: Product[];
}

export default function DealsPage({ products }: DealsPageProps) {
  return (
    <main className="storefront-page storefront-page--subtle deals-page">
      <div className="storefront-page__inner deals-page__inner">
        <header className="storefront-page__header deals-page__header">
          <StorefrontBackButton />
          <p className="storefront-page__eyebrow">Deals</p>
          <h1 className="storefront-page__title">Today&apos;s Deals</h1>
          <p className="storefront-page__meta">
            {products.length} products on sale — limited-time savings on studio and
            stage gear.
          </p>
        </header>

        {products.length === 0 ? (
          <p className="storefront-loading deals-page__empty">No active deals right now. Check back soon.</p>
        ) : (
          <div
            className="cat-product-grid cat-product-grid--grid deals-page__grid"
            role="list"
          >
            {products.map((product) => (
              <div key={product.id} role="listitem" className="deals-page__grid-item">
                <ProductCard product={product} view="grid" />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
