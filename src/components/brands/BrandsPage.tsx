"use client";

import {
  Suspense,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/common/ProductCard";
import BrandsAzNav from "@/components/brands/BrandsAzNav";
import BrandsStaticFilterLayout from "@/components/brands/BrandsStaticFilterLayout";
import CategoryPagination from "@/components/category/CategoryPagination";
import StorefrontBackButton from "@/components/layout/StorefrontBackButton";
import { useBrandsBrowseFilters } from "@/hooks/useBrandsBrowseFilters";
import {
  buildCategoryProductsResult,
  getFilteredListingProducts,
} from "@/lib/catalog/categoryProductsCore";
import { trackViewItemList } from "@/lib/analytics/events";
import { ROUTES } from "@/lib/routes";
import type { BrandDirectoryGroup } from "@/types/brandDirectory";
import type { Product } from "@/types/product";
import "@/components/filters/filters.css";
import "@/components/category/category.css";
import "@/components/brands/brands-directory.css";

interface BrandsPageProps {
  brands: BrandDirectoryGroup[];
}

const PREVIEW_COUNT = 12;

function brandHref(slug: string): string {
  return `${ROUTES.brands}?brand=${encodeURIComponent(slug)}`;
}

function brandAnchor(slug: string): string {
  return `brand-${slug}`;
}

function flattenBrandProducts(brands: BrandDirectoryGroup[], letter: string): Product[] {
  const scoped = letter ? brands.filter((brand) => brand.letter === letter) : brands;
  return scoped.flatMap((brand) => brand.products);
}

function filterBrandGroups(
  brands: BrandDirectoryGroup[],
  letter: string,
  matchingProducts: Product[],
): BrandDirectoryGroup[] {
  const matchingIds = new Set(matchingProducts.map((product) => product.id));
  return brands
    .filter((brand) => !letter || brand.letter === letter)
    .map((brand) => {
      const products = brand.products.filter((product) => matchingIds.has(product.id));
      return { ...brand, products, productCount: products.length };
    })
    .filter((brand) => brand.productCount > 0);
}

function useInViewOnce(rootMargin = "240px"): {
  ref: RefObject<HTMLDivElement | null>;
  visible: boolean;
} {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    if (visible) return;
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, visible]);

  return { ref, visible };
}

function BrandProductGrid({
  brand,
  products,
  eager,
  forceMount,
}: {
  brand: BrandDirectoryGroup;
  products: Product[];
  eager: boolean;
  forceMount: boolean;
}) {
  const { ref, visible } = useInViewOnce();
  const [expanded, setExpanded] = useState(false);
  const shouldMount = forceMount || visible || eager;
  const showAll = forceMount || expanded || products.length <= PREVIEW_COUNT;
  const rendered = showAll ? products : products.slice(0, PREVIEW_COUNT);
  const remaining = products.length - rendered.length;

  return (
    <div ref={ref}>
      {shouldMount ? (
        <>
          <div
            className="cat-product-grid cat-product-grid--grid cat-product-grid--sparse brands-directory__products"
            role="list"
          >
            {rendered.map((product, index) => (
              <div key={product.id} role="listitem">
                <ProductCard
                  product={product}
                  view="grid"
                  listContext={{
                    itemListId: `brand-${brand.slug}`,
                    itemListName: brand.name,
                  }}
                  listIndex={index}
                  eager={eager && index < 4}
                />
              </div>
            ))}
          </div>
          {remaining > 0 ? (
            <button
              type="button"
              className="brands-directory__more"
              onClick={() => setExpanded(true)}
            >
              Show all {products.length} products
            </button>
          ) : null}
        </>
      ) : (
        <div
          className="brands-directory__products-skeleton"
          aria-hidden
          style={{ minHeight: Math.min(products.length, PREVIEW_COUNT) * 80 }}
        />
      )}
    </div>
  );
}

export default function BrandsPage({ brands }: BrandsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="cat-loading" style={{ padding: 48 }}>
          Loading brands...
        </div>
      }
    >
      <BrandsPageContent brands={brands} />
    </Suspense>
  );
}

function BrandsPageContent({ brands }: BrandsPageProps) {
  const searchParams = useSearchParams();
  const activeBrandSlug = searchParams.get("brand")?.split(",")[0]?.trim() ?? "";
  const activeBrand = useMemo(
    () => brands.find((brand) => brand.slug === activeBrandSlug),
    [activeBrandSlug, brands],
  );

  const {
    letter,
    filters,
    updateFilters,
    setLetter,
    clearAllFilters,
    removeBrand,
    removeCategory,
    removeSubcategory,
    removeSpec,
    removeCondition,
    hasActive,
    activeCount,
  } = useBrandsBrowseFilters();

  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    if (!activeBrand || filters.brands.includes(activeBrand.slug)) return;
    updateFilters({ brands: [activeBrand.slug] });
  }, [activeBrand, filters.brands, updateFilters]);

  const catalogProducts = useMemo(() => {
    if (activeBrand) return activeBrand.products;
    return flattenBrandProducts(brands, letter);
  }, [activeBrand, brands, letter]);

  const data = useMemo(
    () => buildCategoryProductsResult(catalogProducts, filters),
    [catalogProducts, filters],
  );

  const matchingProducts = useMemo(
    () => getFilteredListingProducts(catalogProducts, filters),
    [catalogProducts, filters],
  );

  const facetLabels = useMemo(
    () => ({
      brands: Object.fromEntries(data.facets.brands.map((entry) => [entry.slug, entry.name])),
      categories: Object.fromEntries(
        data.facets.categories.map((entry) => [entry.slug, entry.name]),
      ),
      subcategories: Object.fromEntries(
        data.facets.subcategories.map((entry) => [entry.slug, entry.name]),
      ),
      specs: data.facets.specs,
    }),
    [data.facets],
  );

  const directoryBrands = useMemo(() => {
    const scoped = filterBrandGroups(brands, letter, matchingProducts);
    const needle = deferredQuery.trim().toLowerCase();
    if (!needle) return scoped;

    return scoped
      .map((brand) => {
        const brandHit = brand.name.toLowerCase().includes(needle);
        const products = brandHit
          ? brand.products
          : brand.products.filter((product) =>
              `${product.name} ${product.category}`.toLowerCase().includes(needle),
            );
        return { ...brand, products, productCount: products.length };
      })
      .filter((brand) => brand.productCount > 0);
  }, [brands, deferredQuery, letter, matchingProducts]);

  const productTotal = useMemo(
    () => brands.reduce((sum, brand) => sum + brand.productCount, 0),
    [brands],
  );

  const listContext = useMemo(
    () => ({
      itemListId: activeBrand
        ? `brand_${activeBrand.slug}`
        : letter
          ? `brands_letter_${letter}`
          : "brands-directory",
      itemListName: activeBrand?.name ?? (letter ? `Brands · ${letter}` : "Brands"),
    }),
    [activeBrand, letter],
  );

  useEffect(() => {
    const products = activeBrand ? data.products : matchingProducts.slice(0, 24);
    if (!products.length) return;
    trackViewItemList(products, listContext);
  }, [activeBrand, data.products, listContext, matchingProducts]);

  return (
    <main className="storefront-page storefront-page--subtle brands-directory">
      <div className="storefront-page__inner brands-directory__inner cat-page">
        <header className="brands-directory__hero">
          <StorefrontBackButton />
          <p className="storefront-page__eyebrow">Authorized catalog</p>
          <h1 className="brands-directory__title">
            {activeBrand ? activeBrand.name : letter ? `Brands · ${letter}` : "Brands"}
          </h1>
          <p className="brands-directory__lede">
            {activeBrand
              ? `${data.total} products · refine by category, specifications, price, and more.`
              : "Every brand we stock, with filters always available on the left. Jump by letter, search a name, or open a brand collection."}
          </p>
          {!activeBrand ? (
            <dl className="brands-directory__stats">
              <div>
                <dt>Brands</dt>
                <dd>{brands.length}</dd>
              </div>
              <div>
                <dt>Products</dt>
                <dd>{productTotal}</dd>
              </div>
              <div>
                <dt>Showing</dt>
                <dd>{data.total}</dd>
              </div>
            </dl>
          ) : null}
        </header>

        {brands.length === 0 ? (
          <div className="cat-empty">
            <p>Brands will appear here once the catalog is available.</p>
            <Link href={ROUTES.search} className="cat-empty__link">
              Search products
            </Link>
          </div>
        ) : (
          <>
            {!activeBrand ? (
              <div className="brands-directory__toolbar" role="search">
                <label className="brands-directory__search">
                  <span className="visually-hidden">Search brands and products</span>
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search brands or products"
                    autoComplete="off"
                    enterKeyHint="search"
                  />
                </label>
                <BrandsAzNav
                  brands={brands}
                  activeLetter={letter || null}
                  onLetterChange={setLetter}
                />
              </div>
            ) : null}

            <BrandsStaticFilterLayout
              filters={filters}
              facets={data.facets}
              facetLabels={facetLabels}
              resultCount={data.total}
              onUpdate={updateFilters}
              onClearAll={clearAllFilters}
              onRemoveBrand={removeBrand}
              onRemoveCategory={removeCategory}
              onRemoveSubcategory={removeSubcategory}
              onRemoveSpec={removeSpec}
              onRemoveCondition={removeCondition}
              hasActive={hasActive}
              activeCount={activeCount}
            >
              {activeBrand ? (
                data.products.length === 0 ? (
                  <div className="cat-empty">
                    <h2 style={{ margin: "0 0 8px" }}>No products match your filters</h2>
                    <p style={{ margin: 0, color: "#807f7e" }}>
                      Try adjusting or clearing your filters for {activeBrand.name}.
                    </p>
                    {hasActive ? (
                      <button
                        type="button"
                        className="cat-filter-clear"
                        style={{ marginTop: 16 }}
                        onClick={clearAllFilters}
                      >
                        Clear filters
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <>
                    <header className="brands-shop__hero brands-shop__hero--inline">
                      <span className="brands-shop__mark" aria-hidden>
                        {activeBrand.logoUrl ? (
                          <Image
                            src={activeBrand.logoUrl}
                            alt=""
                            width={160}
                            height={72}
                            className="brands-directory__logo-img"
                          />
                        ) : (
                          <span className="brands-directory__monogram brands-directory__monogram--lg">
                            {activeBrand.name.trim().charAt(0)}
                          </span>
                        )}
                      </span>
                      <div>
                        <p className="brands-directory__house-letter">{activeBrand.letter}</p>
                        <h2 className="brands-directory__house-title">{activeBrand.name}</h2>
                        <p className="brands-directory__house-count">
                          {data.total} listed {data.total === 1 ? "product" : "products"}
                        </p>
                      </div>
                      <Link href={ROUTES.brands} className="brands-browse__reset">
                        All brands
                      </Link>
                    </header>
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
                )
              ) : directoryBrands.length === 0 ? (
                <p className="brands-directory__empty">No brands or products match your filters.</p>
              ) : (
                <>
                  <section className="brands-directory__index" aria-label="Brand index">
                    <h2 className="brands-directory__section-kicker">Shop by brand</h2>
                    <ul className="brands-directory__logo-grid">
                      {directoryBrands.map((brand) => (
                        <li key={brand.id}>
                          <Link
                            className="brands-directory__logo-card"
                            href={brandHref(brand.slug)}
                          >
                            <span className="brands-directory__logo-mark" aria-hidden>
                              {brand.logoUrl ? (
                                <Image
                                  src={brand.logoUrl}
                                  alt=""
                                  width={160}
                                  height={72}
                                  className="brands-directory__logo-img"
                                />
                              ) : (
                                <span className="brands-directory__monogram">
                                  {brand.name.trim().charAt(0)}
                                </span>
                              )}
                            </span>
                            <span className="brands-directory__logo-meta">
                              <span className="brands-directory__logo-name">{brand.name}</span>
                              <span className="brands-directory__logo-count">
                                {brand.productCount}{" "}
                                {brand.productCount === 1 ? "product" : "products"}
                              </span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>

                  {directoryBrands.map((brand, brandIndex) => (
                    <section
                      key={brand.id}
                      id={brandAnchor(brand.slug)}
                      className="brands-directory__house"
                      aria-labelledby={`${brandAnchor(brand.slug)}-title`}
                    >
                      <header className="brands-directory__house-head">
                        <div className="brands-directory__house-identity">
                          <span className="brands-directory__house-mark" aria-hidden>
                            {brand.logoUrl ? (
                              <Image
                                src={brand.logoUrl}
                                alt=""
                                width={140}
                                height={56}
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
                            <h2
                              id={`${brandAnchor(brand.slug)}-title`}
                              className="brands-directory__house-title"
                            >
                              {brand.name}
                            </h2>
                            <p className="brands-directory__house-count">
                              {brand.productCount} listed{" "}
                              {brand.productCount === 1 ? "product" : "products"}
                            </p>
                          </div>
                        </div>
                        <Link href={brandHref(brand.slug)} className="brands-directory__house-link">
                          View brand collection
                        </Link>
                      </header>

                      <BrandProductGrid
                        brand={brand}
                        products={brand.products}
                        eager={brandIndex === 0}
                        forceMount={Boolean(deferredQuery.trim()) || brandIndex < 2}
                      />
                    </section>
                  ))}
                </>
              )}
            </BrandsStaticFilterLayout>
          </>
        )}
      </div>
    </main>
  );
}
