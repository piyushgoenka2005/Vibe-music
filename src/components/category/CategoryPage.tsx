"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useFilterStore } from "@/store/filterStore";
import { useCategoryFilters } from "@/hooks/useCategoryFilters";
import { useCategoryProducts } from "@/hooks/useCategoryProducts";
import ProductCard from "@/components/common/ProductCard";
import { trackViewItemList } from "@/lib/analytics/events";
import {
  FilterChips,
  FilterSidebar,
  MobileFilterDrawer,
  SortDropdown,
  ViewToggle,
} from "@/components/filters";
import CategoryBreadcrumb from "./CategoryBreadcrumb";
import CategoryPagination from "./CategoryPagination";
import { SlidersHorizontal } from "lucide-react";
import type { Category } from "@/types/category";
import type { CategoryProductsResult } from "@/types/filters";
import "../filters/filters.css";
import "./category.css";

interface CategoryPageProps {
  category: Category;
  initialData?: CategoryProductsResult;
}

function CategoryPageContent({ category, initialData }: CategoryPageProps) {
  const {
    filters,
    updateFilters,
    clearAllFilters,
    removeBrand,
    removeCondition,
    hasActive,
    activeCount,
  } = useCategoryFilters();
  const openMobileDrawer = useFilterStore((s) => s.openMobileDrawer);
  const { data, isLoading, isError } = useCategoryProducts(
    category.slug,
    filters,
    initialData
  );

  const facets = data?.facets ?? { brands: [], priceRange: { min: 0, max: 0 } };
  const total = data?.total ?? 0;
  const listContext = useMemo(
    () => ({
      itemListId: `category_${category.slug}`,
      itemListName: category.name,
    }),
    [category.slug, category.name]
  );

  useEffect(() => {
    if (!data?.products?.length) return;
    trackViewItemList(data.products, listContext);
  }, [listContext, data?.products, data?.page]);

  return (
    <div className="cat-page">
      <CategoryBreadcrumb categoryName={category.name} />
      <h1 className="cat-page__title">{category.name}</h1>
      <p className="cat-page__desc">{category.description}</p>

      <div className="cat-toolbar">
        <div className="cat-toolbar__primary">
          <button
            type="button"
            className={`cat-toolbar__mobile-btn${hasActive ? " cat-toolbar__mobile-btn--active" : ""}`}
            onClick={openMobileDrawer}
          >
            <SlidersHorizontal size={16} strokeWidth={2.25} aria-hidden />
            <span>Filters</span>
            {activeCount > 0 ? (
              <span className="cat-toolbar__badge">{activeCount}</span>
            ) : null}
          </button>
          <span className="cat-toolbar__count" aria-live="polite">
            {isLoading ? "Loading…" : `${total} products`}
          </span>
        </div>
        <div className="cat-toolbar__controls">
          <SortDropdown
            value={filters.sort}
            onChange={(sort) => updateFilters({ sort })}
          />
          <ViewToggle
            value={filters.view}
            onChange={(view) => updateFilters({ view }, false)}
          />
        </div>
      </div>

      <FilterChips
        filters={filters}
        onRemoveBrand={removeBrand}
        onRemoveCondition={removeCondition}
        onUpdate={updateFilters}
        onClearAll={clearAllFilters}
      />

      <div className="cat-page__layout">
        <FilterSidebar
          filters={filters}
          facets={facets}
          onUpdate={updateFilters}
          className="cat-filter-sidebar--desktop"
        />

        <div>
          {isLoading ? (
            <div className="cat-loading" role="status" aria-live="polite">
              <div className="cat-loading__spinner" aria-hidden="true" />
              Loading products...
            </div>
          ) : null}

          {isError ? (
            <div className="cat-empty" role="alert">
              <p>Unable to load products. Please try again.</p>
            </div>
          ) : null}

          {!isLoading && !isError && data && data.products.length === 0 ? (
            <div className="cat-empty">
              <h2 style={{ margin: "0 0 8px" }}>No products match your filters</h2>
              <p style={{ margin: 0, color: "#807f7e" }}>
                Try adjusting or clearing your filters.
              </p>
              {hasActive ? (
                <button
                  type="button"
                  className="cat-filter-clear"
                  style={{ marginTop: 16 }}
                  onClick={clearAllFilters}
                >
                  Clear All Filters
                </button>
              ) : null}
            </div>
          ) : null}

          {!isLoading && !isError && data && data.products.length > 0 ? (
            <>
              <div
                className={`cat-product-grid cat-product-grid--${filters.view}`}
                role="list"
              >
                {data.products.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    view={filters.view}
                    listContext={listContext}
                    listIndex={index}
                  />
                ))}
              </div>
              <CategoryPagination
                page={data.page}
                totalPages={data.totalPages}
                onPageChange={(page) => updateFilters({ page }, false)}
              />
            </>
          ) : null}
        </div>
      </div>

      <MobileFilterDrawer
        filters={filters}
        facets={facets}
        onUpdate={updateFilters}
        onClearAll={clearAllFilters}
        resultCount={total}
      />
    </div>
  );
}

export default function CategoryPage({ category, initialData }: CategoryPageProps) {
  return (
    <Suspense
      fallback={
        <div className="cat-loading" style={{ padding: 48 }}>
          Loading category...
        </div>
      }
    >
      <CategoryPageContent category={category} initialData={initialData} />
    </Suspense>
  );
}
