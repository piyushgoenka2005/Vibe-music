"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useFilterStore } from "@/store/filterStore";
import { useSearchListingFilters } from "@/hooks/useSearchListingFilters";
import { useSearchResults } from "@/hooks/useSearch";
import { buildCategoryProductsResult } from "@/lib/catalog/categoryProductsCore";
import { ROUTES } from "@/lib/routes";
import { slugify } from "@/lib/slug";
import ProductCard from "@/components/common/ProductCard";
import {
  FilterChips,
  FilterSidebar,
  MobileFilterDrawer,
  SortDropdown,
  ViewToggle,
} from "@/components/filters";
import CategoryPagination from "@/components/category/CategoryPagination";
import StorefrontBackButton from "@/components/layout/StorefrontBackButton";
import SearchEmptyState from "./SearchEmptyState";
import SearchRecentlyViewed from "./SearchRecentlyViewed";
import { SlidersHorizontal } from "lucide-react";
import type { Product } from "@/types/product";
import type { SearchProduct, SearchResultsData } from "@/types/search";
import "../filters/filters.css";
import "../category/category.css";
import "./search.css";

interface SearchResultsPageProps {
  query: string;
  initialCategory?: string;
  initialSubcategory?: string;
  /** Server-rendered results for the initial query — skips the first client fetch. */
  initialResults?: SearchResultsData | null;
}

function toListingProduct(product: SearchProduct): Product {
  const full = product as SearchProduct & Partial<Product>;
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    brandSlug: full.brandSlug ?? slugify(product.brand),
    category: product.category,
    categorySlug: full.categorySlug ?? slugify(product.category),
    price: product.price,
    originalPrice: full.originalPrice,
    gstRate: full.gstRate,
    rating: product.rating ?? full.rating ?? 0,
    reviewCount: product.reviewCount ?? full.reviewCount ?? 0,
    availability: product.availability ?? full.availability ?? "in-stock",
    condition: full.condition ?? "new",
    imageColor: product.imageColor ?? full.imageColor ?? "#e8e8e8",
    image: product.image,
  };
}

function SearchResultsPageContent({
  query,
  initialCategory = "",
  initialSubcategory = "",
  initialResults = null,
}: SearchResultsPageProps) {
  const {
    filters,
    updateFilters,
    clearAllFilters,
    removeBrand,
    removeCondition,
    hasActive,
    activeCount,
    categorySlug,
    subcategory,
  } = useSearchListingFilters();
  const openMobileDrawer = useFilterStore((s) => s.openMobileDrawer);

  const urlCategory = categorySlug || initialCategory;
  const urlSubcategory = subcategory || initialSubcategory;

  const { status, error, results } = useSearchResults(
    query,
    {
      category: urlCategory || undefined,
      subcategory: urlSubcategory || undefined,
      all: true,
    },
    {
      initialResults,
      initialFilters: {
        category: initialCategory,
        subcategory: initialSubcategory,
      },
    }
  );

  const listingProducts = useMemo(
    () => (results?.products ?? []).map(toListingProduct),
    [results?.products]
  );

  const data = useMemo(
    () => buildCategoryProductsResult(listingProducts, filters),
    [listingProducts, filters]
  );

  const facets = data.facets;
  const total = data.total;
  const isLoading = status === "loading";
  const isError = status === "error";
  const hasQuery =
    query.trim().length >= 2 || Boolean(urlCategory) || Boolean(urlSubcategory);

  return (
    <div className="cat-page">
      <div className="storefront-nav-chrome">
        <StorefrontBackButton fallbackHref={ROUTES.search} />
        <nav className="cat-breadcrumb" aria-label="Breadcrumb">
          <Link href={ROUTES.home}>Home</Link>
          <span className="cat-breadcrumb__sep" aria-hidden="true">
            /
          </span>
          <span aria-current="page">Search</span>
        </nav>
      </div>

      <h1 className="cat-page__title">
        {query.trim() ? (
          <>
            Results for &ldquo;{query.trim()}&rdquo;
          </>
        ) : urlSubcategory.toLowerCase().includes("acoustic") ? (
          "Acoustic Guitars"
        ) : urlSubcategory.toLowerCase().includes("amplifier") ? (
          "Amplifiers"
        ) : urlSubcategory ? (
          urlSubcategory
        ) : urlCategory ? (
          <>Browsing {urlCategory.replace(/-/g, " ")}</>
        ) : (
          "Search Results"
        )}
      </h1>
      <p className="cat-page__desc">
        {hasQuery
          ? "Browse matching products and refine with filters."
          : "Enter a search term to see products."}
      </p>

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
              <p>{error ?? "Unable to load products. Please try again."}</p>
            </div>
          ) : null}

          {!isLoading && !isError && hasQuery && data.products.length === 0 ? (
            hasActive ? (
              <div className="cat-empty">
                <h2 style={{ margin: "0 0 8px" }}>No products match your filters</h2>
                <p style={{ margin: 0, color: "#807f7e" }}>
                  Try adjusting or clearing your filters.
                </p>
                <button
                  type="button"
                  className="cat-filter-clear"
                  style={{ marginTop: 16 }}
                  onClick={clearAllFilters}
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <SearchEmptyState query={query} />
            )
          ) : null}

          {!isLoading && !isError && data.products.length > 0 ? (
            <>
              <div
                className={`cat-product-grid cat-product-grid--${filters.view}`}
                role="list"
              >
                {data.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    view={filters.view}
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

      <SearchRecentlyViewed className="sw-search-recent--results" />
    </div>
  );
}

export default function SearchResultsPage(props: SearchResultsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="cat-loading" style={{ padding: 48 }}>
          Loading search results...
        </div>
      }
    >
      <SearchResultsPageContent {...props} />
    </Suspense>
  );
}
