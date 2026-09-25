"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useFilterStore } from "@/store/filterStore";
import { useBrandsBrowseFilters } from "@/hooks/useBrandsBrowseFilters";
import { buildCategoryProductsResult } from "@/lib/catalog/categoryProductsCore";
import { trackViewItemList } from "@/lib/analytics/events";
import { ROUTES } from "@/lib/routes";
import ProductCard from "@/components/common/ProductCard";
import CategoryPagination from "@/components/category/CategoryPagination";
import StorefrontBackButton from "@/components/layout/StorefrontBackButton";
import BrandsAzNav from "@/components/brands/BrandsAzNav";
import {
  FilterChips,
  FilterSidebar,
  MobileFilterDrawer,
  SortDropdown,
  ViewToggle,
} from "@/components/filters";
import { SlidersHorizontal } from "lucide-react";
import type { BrandDirectoryGroup } from "@/types/brandDirectory";
import type { Product } from "@/types/product";
import "@/components/filters/filters.css";
import "@/components/category/category.css";
import "./brands-directory.css";

interface BrandsFilteredBrowseViewProps {
  brands: BrandDirectoryGroup[];
}

function flattenBrandProducts(brands: BrandDirectoryGroup[], letter: string): Product[] {
  const scoped = letter ? brands.filter((brand) => brand.letter === letter) : brands;
  return scoped.flatMap((brand) => brand.products);
}

export default function BrandsFilteredBrowseView({ brands }: BrandsFilteredBrowseViewProps) {
  const {
    letter,
    filters,
    updateFilters,
    setLetter,
    clearAllFilters,
    clearBrowse,
    removeBrand,
    removeCategory,
    removeSubcategory,
    removeSpec,
    removeCondition,
    hasActive,
    activeCount,
  } = useBrandsBrowseFilters();
  const openMobileDrawer = useFilterStore((s) => s.openMobileDrawer);

  const catalogProducts = useMemo(() => flattenBrandProducts(brands, letter), [brands, letter]);

  const data = useMemo(
    () => buildCategoryProductsResult(catalogProducts, filters),
    [catalogProducts, filters],
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
      itemListId: letter ? `brands_letter_${letter}` : "brands_browse",
      itemListName: letter ? `Brands · ${letter}` : "Browse brands",
    }),
    [letter],
  );

  useEffect(() => {
    if (!data.products.length) return;
    trackViewItemList(data.products, listContext);
  }, [listContext, data.products, data.page]);

  const title = letter ? `Brands · ${letter}` : "Browse brands";
  const subtitle = letter
    ? `All products from brands starting with “${letter}”. Refine with categories, specifications, and price.`
    : "Refine the full brand catalog by category, specifications, price, and more.";

  return (
    <div className="cat-page brands-browse">
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
          <span aria-current="page">{letter || "Browse"}</span>
        </nav>
      </div>

      <header className="brands-browse__hero">
        <div>
          <p className="brands-directory__house-letter">Shop by brand</p>
          <h1 className="cat-page__title brands-browse__title">{title}</h1>
          <p className="cat-page__desc">{subtitle}</p>
        </div>
        <button type="button" className="brands-browse__reset" onClick={clearBrowse}>
          View all brands
        </button>
      </header>

      <div className="brands-directory__toolbar brands-browse__toolbar" role="search">
        <BrandsAzNav brands={brands} activeLetter={letter || null} onLetterChange={setLetter} />
      </div>

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
        onClearAll={clearAllFilters}
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
                Try another letter or clear your filters.
              </p>
              <button
                type="button"
                className="cat-filter-clear"
                style={{ marginTop: 16 }}
                onClick={clearAllFilters}
              >
                Clear filters
              </button>
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
        onClearAll={clearAllFilters}
        resultCount={data.total}
        showCategoryFacets
      />
    </div>
  );
}
