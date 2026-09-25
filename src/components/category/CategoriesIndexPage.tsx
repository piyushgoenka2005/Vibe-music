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

export default function CategoriesIndexPage({ categories }: CategoriesIndexPageProps) {
  return (
    <main className="storefront-page storefront-page--subtle">
      <div className="cat-page categories-index">
        <div className="storefront-nav-chrome">
          <StorefrontBackButton fallbackHref={ROUTES.home} />
          <nav className="cat-breadcrumb" aria-label="Breadcrumb">
            <Link href={ROUTES.home}>Home</Link>
            <span className="cat-breadcrumb__sep" aria-hidden="true">
              /
            </span>
            <span aria-current="page">Categories</span>
          </nav>
        </div>

        <p className="categories-index__eyebrow">Shop by department</p>
        <h1 className="cat-page__title">Categories</h1>
        <p className="cat-page__desc">
          {categories.length > 0
            ? `Browse ${categories.length} departments stocked at Vibe Music.`
            : "Departments will appear here once the catalog is available."}
        </p>

        {categories.length === 0 ? (
          <div className="cat-empty">
            <p>No categories with products are available right now.</p>
            <Link href={ROUTES.search} className="cat-empty__link">
              Search products
            </Link>
          </div>
        ) : (
          <ul className="categories-index__grid">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={category.href ?? categoryPath(category.slug)}
                  className="categories-index__card"
                >
                  {category.imageSrc ? (
                    <span className="categories-index__thumb-wrap">
                      <Image
                        src={category.imageSrc}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 45vw, (max-width: 1023px) 30vw, 18vw"
                        className="categories-index__thumb"
                      />
                    </span>
                  ) : null}
                  <span className="categories-index__name">{category.name}</span>
                  <span className="categories-index__count">
                    {category.productCount} {category.productCount === 1 ? "product" : "products"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
