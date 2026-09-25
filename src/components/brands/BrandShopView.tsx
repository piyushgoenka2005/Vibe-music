"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useFilterStore } from "@/store/filterStore";
import { useCategoryFilters } from "@/hooks/useCategoryFilters";
import { buildCategoryProductsResult } from "@/lib/catalog/categoryProductsCore";
import { trackViewItemList } from "@/lib/analytics/events";
import { ROUTES } from "@/lib/routes";
import ProductCard from "@/components/common/ProductCard";
import CategoryPagination from "@/components/category/CategoryPagination";
import StorefrontBackButton from "@/components/layout/StorefrontBackButton";
import {
  FilterChips,
  FilterSidebar,
  MobileFilterDrawer,
  SortDropdown,
  ViewToggle,
} from "@/components/filters";
import { SlidersHorizontal } from "lucide-react";
import type { BrandDirectoryGroup } from "@/types/brandDirectory";
import "@/components/filters/filters.css";
import "@/components/category/category.css";
import "./brands-directory.css";

interface BrandShopViewProps {
  brand: BrandDirectoryGroup;
}

function BrandShopViewContent({ brand }: BrandShopViewProps) {
  const {
    filters,
    updateFilters,
    clearAllFilters,
    removeBrand,
    removeCategory,
    removeSubcategory,
    removeSpec,
    removeCondition,
    hasActive,
    activeCount,
  } = useCategoryFilters();
  const openMobileDrawer = useFilterStore((s) => s.openMobileDrawer);

  useEffect(() => {
    if (filters.brands.includes(brand.slug)) return;
    updateFilters({ brands: [brand.slug] });
  }, [brand.slug, filters.brands, updateFilters]);

  const data = useMemo(
    () => buildCategoryProductsResult(brand.products, filters),
    [brand.products, filters],
  );

  const facets = data.facets;
  const facetLabels = useMemo(
    () => ({
      brands: Object.fromEntries(facets.brands.map((entry) => [entry.slug, entry.name])),
      categories: Object.fromEntries(facets.categories.map((entry) => [entry.slug, entry.name])),
      subcategories: Object.fromEntries(
        facets.subcategories.map((entry) => [entry.slug, entry.name]),
      ),
      specs: facets.specs,
    }),
    [facets],
  );

  const listContext = useMemo(
    () => ({
      itemListId: `brand_${brand.slug}`,
      itemListName: brand.name,
    }),
    [brand.slug, brand.name],
  );

  useEffect(() => {
    if (!data.products.length) return;
    trackViewItemList(data.products, listContext);
  }, [listContext, data.products, data.page]);

  const handleClearAll = () => {
    clearAllFilters();
  };

  return (
    <div className="cat-page brands-shop">
      <div className="storefront-nav-chrome">
        <StorefrontBackButton fallbackHref={ROUTES.brands} />
        <nav className="cat-breadcrumb" aria-label="Breadcrumb">
          <Link href={ROUTES.home}>Home</Link>
          <span className="cat-breadcrumb__sep" aria-hidden="true">
            /
          </span>
          <Link href={ROUTES.brands}>Brands</Link>
          <span className="cat-breadcrumb__sep" aria-hidden="true">
            /
          </span>
          <span aria-current="page">{brand.name}</span>
        </nav>
      </div>

      <header className="brands-shop__hero">
        <span className="brands-shop__mark" aria-hidden>
          {brand.logoUrl ? (
            <Image
              src={brand.logoUrl}
              alt=""
              width={160}
              height={72}
              className="brands-directory__logo-img"
            />
          ) : (
            <span className="brands-directory__monogram brands-directory__monogram--lg">
              {brand.name.trim().charAt(0)}
            </span>
          )}
        </span>
        <div>
          <p className="brands-directory__house-letter">{brand.letter}</p>
          <h1 className="cat-page__title brands-shop__title">{brand.name}</h1>
          <p className="cat-page__desc">
            {data.total} {data.total === 1 ? "product" : "products"} · refine by category,
            specifications, price, and more.
          </p>
        </div>
      </header>

      <div className="cat-toolbar">
        <div className="cat-toolbar__primary">
          <button
            type="button"
            className={`cat-toolbar__mobile-btn${hasActive ? " cat-toolbar__mobile-btn--active" : ""}`}
            onClick={openMobileDrawer}
          >
            <SlidersHorizontal size={16} strokeWidth={2.25} aria-hidden />
            <span>Filters</span>
            {activeCount > 0 ? <span className="cat-toolbar__badge">{activeCount}</span> : null}
          </button>
          <span className="cat-toolbar__count" aria-live="polite">
            {data.total} products
          </span>
        </div>
        <div className="cat-toolbar__controls">
          <SortDropdown value={filters.sort} onChange={(sort) => updateFilters({ sort })} />
          <ViewToggle value={filters.view} onChange={(view) => updateFilters({ view }, false)} />
        </div>
      </div>

      <FilterChips
        filters={filters}
        facetLabels={facetLabels}
        onRemoveBrand={removeBrand}
        onRemoveCategory={removeCategory}
        onRemoveSubcategory={removeSubcategory}
        onRemoveSpec={removeSpec}
        onRemoveCondition={removeCondition}
        onUpdate={updateFilters}
        onClearAll={handleClearAll}
      />

      <div className="cat-page__layout">
        <FilterSidebar
          filters={filters}
          facets={facets}
          onUpdate={updateFilters}
          className="cat-filter-sidebar--desktop"
          showCategoryFacets
        />

        <div>
          {data.products.length === 0 ? (
            <div className="cat-empty">
              <h2 style={{ margin: "0 0 8px" }}>No products match your filters</h2>
              <p style={{ margin: 0, color: "#807f7e" }}>
                Try adjusting or clearing your filters for {brand.name}.
              </p>
              {hasActive ? (
                <button
                  type="button"
                  className="cat-filter-clear"
                  style={{ marginTop: 16 }}
                  onClick={handleClearAll}
                >
                  Clear All Filters
                </button>
              ) : null}
            </div>
          ) : (
            <>
              <div
                className={`cat-product-grid cat-product-grid--${filters.view} cat-product-grid--sparse`}
                role="list"
              >
                {data.products.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    view={filters.view}
                    listContext={listContext}
                    listIndex={index}
                    eager={index < 4}
                  />
                ))}
              </div>
              <CategoryPagination
                page={data.page}
                totalPages={data.totalPages}
                onPageChange={(page) => updateFilters({ page }, false)}
              />
            </>
          )}
        </div>
      </div>

      <MobileFilterDrawer
        filters={filters}
        facets={facets}
        onUpdate={updateFilters}
        onClearAll={handleClearAll}
        resultCount={data.total}
        showCategoryFacets
      />
    </div>
  );
}

export default function BrandShopView(props: BrandShopViewProps) {
  return <BrandShopViewContent {...props} />;
}
