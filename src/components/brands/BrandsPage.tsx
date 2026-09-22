"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/common/ProductCard";
import StorefrontBackButton from "@/components/layout/StorefrontBackButton";
import { trackViewItemList } from "@/lib/analytics/events";
import { ROUTES } from "@/lib/routes";
import type { BrandDirectoryGroup } from "@/types/brandDirectory";
import type { Product } from "@/types/product";
import "@/components/category/category.css";
import "@/components/brands/brands-directory.css";

interface BrandsPageProps {
  brands: BrandDirectoryGroup[];
}

const LETTERS = [
  "#",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
] as const;

const PREVIEW_COUNT = 12;

function brandHref(slug: string): string {
  return `${ROUTES.searchResults}?brand=${encodeURIComponent(slug)}`;
}

function brandAnchor(slug: string): string {
  return `brand-${slug}`;
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
            className="cat-product-grid cat-product-grid--grid brands-directory__products"
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
  const [query, setQuery] = useState("");
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  const productTotal = useMemo(
    () => brands.reduce((sum, brand) => sum + brand.productCount, 0),
    [brands],
  );

  const availableLetters = useMemo(() => new Set(brands.map((brand) => brand.letter)), [brands]);

  const filtered = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    return brands
      .filter((brand) => !activeLetter || brand.letter === activeLetter)
      .map((brand) => {
        if (!needle) return brand;
        const brandHit = brand.name.toLowerCase().includes(needle);
        const products = brandHit
          ? brand.products
          : brand.products.filter((product) =>
              `${product.name} ${product.category}`.toLowerCase().includes(needle),
            );
        return { ...brand, products, productCount: products.length };
      })
      .filter((brand) => brand.productCount > 0);
  }, [activeLetter, brands, deferredQuery]);

  const forceMountGrids = Boolean(deferredQuery.trim() || activeLetter);

  useEffect(() => {
    const products = filtered.flatMap((brand) => brand.products);
    if (!products.length) return;
    trackViewItemList(products.slice(0, 24), {
      itemListId: "brands-directory",
      itemListName: "Brands",
    });
  }, [filtered]);

  return (
    <main className="storefront-page storefront-page--subtle brands-directory">
      <div className="storefront-page__inner brands-directory__inner">
        <header className="brands-directory__hero">
          <StorefrontBackButton />
          <p className="storefront-page__eyebrow">Authorized catalog</p>
          <h1 className="brands-directory__title">Brands</h1>
          <p className="brands-directory__lede">
            Every brand we stock, with every listed product underneath. Jump by letter, search a
            name, or open a brand to shop the full collection.
          </p>
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
              <dt>Coverage</dt>
              <dd>Full catalog</dd>
            </div>
          </dl>
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
              <nav className="brands-directory__az" aria-label="Jump to brand letter">
                {LETTERS.map((letter) => {
                  const enabled = availableLetters.has(letter);
                  const pressed = activeLetter === letter;
                  return (
                    <button
                      key={letter}
                      type="button"
                      className={`brands-directory__az-btn${pressed ? " is-active" : ""}`}
                      disabled={!enabled}
                      aria-pressed={pressed}
                      onClick={() =>
                        setActiveLetter((current) => (current === letter ? null : letter))
                      }
                    >
                      {letter}
                    </button>
                  );
                })}
              </nav>
            </div>

            <section className="brands-directory__index" aria-label="Brand index">
              <h2 className="brands-directory__section-kicker">Shop by brand</h2>
              <ul className="brands-directory__logo-grid">
                {filtered.map((brand) => (
                  <li key={brand.id}>
                    <a className="brands-directory__logo-card" href={`#${brandAnchor(brand.slug)}`}>
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
                          {brand.productCount} {brand.productCount === 1 ? "product" : "products"}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            {filtered.length === 0 ? (
              <p className="brands-directory__empty">No brands or products match that filter.</p>
            ) : (
              filtered.map((brand, brandIndex) => (
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
                    forceMount={forceMountGrids || brandIndex < 2}
                  />
                </section>
              ))
            )}
          </>
        )}
      </div>
    </main>
  );
}
