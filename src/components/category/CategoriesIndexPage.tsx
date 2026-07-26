"use client";

import Image from "next/image";
import Link from "next/link";
import StorefrontBackButton from "@/components/layout/StorefrontBackButton";
import { categoryPath, ROUTES } from "@/lib/routes";
import type { CategoryIndexItem } from "@/lib/server/categoriesPageLoader";
import "@/components/category/category.css";

interface CategoriesIndexPageProps {
  categories: CategoryIndexItem[];
}

export default function CategoriesIndexPage({
  categories,
}: CategoriesIndexPageProps) {
  return (
    <main className="storefront-page storefront-page--subtle brands-page categories-index">
      <header className="storefront-page__header">
        <StorefrontBackButton />
        <p className="storefront-page__eyebrow">Shop by department</p>
        <h1 className="storefront-page__title">Categories</h1>
        <p className="storefront-page__meta">
          {categories.length > 0
            ? `Browse ${categories.length} departments stocked at Vibe Music.`
            : "Departments will appear here once the catalog is available."}
        </p>
      </header>

      {categories.length === 0 ? (
        <div className="cat-empty">
          <p>No categories with products are available right now.</p>
          <Link href={ROUTES.search} className="cat-empty__link">
            Search products
          </Link>
        </div>
      ) : (
        <ul className="cat-product-grid cat-product-grid--grid brands-page__grid">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={categoryPath(category.slug)}
                className="cat-product-card brands-page__card categories-index__card"
              >
                {category.imageSrc ? (
                  <span className="categories-index__thumb-wrap">
                    <Image
                      src={category.imageSrc}
                      alt={category.name}
                      width={96}
                      height={96}
                      className="categories-index__thumb"
                    />
                  </span>
                ) : null}
                <span className="brands-page__name">{category.name}</span>
                <span className="brands-page__count">
                  {category.productCount}{" "}
                  {category.productCount === 1 ? "product" : "products"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
