"use client";

import Link from "next/link";
import StorefrontBackButton from "@/components/layout/StorefrontBackButton";
import { formatSubcategoryLabel } from "@/lib/product/productBreadcrumb";
import { categoryPath, ROUTES } from "@/lib/routes";
import { unslugify } from "@/lib/slug";

interface CategoryBreadcrumbProps {
  categoryName: string;
  categorySlug: string;
  /** Active `subcat` filter slug from the category listing URL. */
  activeSubcategorySlug?: string;
  /** Facet slug → display label map for subcategories on this category page. */
  subcategoryLabels?: Record<string, string>;
}

export default function CategoryBreadcrumb({
  categoryName,
  categorySlug,
  activeSubcategorySlug,
  subcategoryLabels,
}: CategoryBreadcrumbProps) {
  const rawSubcategoryLabel =
    activeSubcategorySlug && subcategoryLabels?.[activeSubcategorySlug]
      ? subcategoryLabels[activeSubcategorySlug]
      : activeSubcategorySlug
        ? unslugify(activeSubcategorySlug)
        : undefined;
  const subcategoryLabel = rawSubcategoryLabel
    ? formatSubcategoryLabel(rawSubcategoryLabel)
    : undefined;

  return (
    <div className="storefront-nav-chrome">
      <StorefrontBackButton />
      <nav className="cat-breadcrumb" aria-label="Breadcrumb">
        <Link href={ROUTES.home}>Home</Link>
        <span className="cat-breadcrumb__sep" aria-hidden="true">
          /
        </span>
        {subcategoryLabel ? (
          <>
            <Link href={categoryPath(categorySlug)}>{categoryName}</Link>
            <span className="cat-breadcrumb__sep" aria-hidden="true">
              /
            </span>
            <span aria-current="page">{subcategoryLabel}</span>
          </>
        ) : (
          <>
            <Link href={ROUTES.categories}>Categories</Link>
            <span className="cat-breadcrumb__sep" aria-hidden="true">
              /
            </span>
            <span aria-current="page">{categoryName}</span>
          </>
        )}
      </nav>
    </div>
  );
}
