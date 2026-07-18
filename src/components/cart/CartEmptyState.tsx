"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import StorefrontThumbImage from "@/components/common/StorefrontThumbImage";
import { categoryPath, ROUTES } from "@/lib/routes";
import { fetchProductSummaries, fetchProducts } from "@/services/products.api";
import { useCartStore } from "@/store/cartStore";
import { useRecentlyViewedStore } from "@/store/recentlyViewedStore";
import type { Product } from "@/types/product";
import { formatDisplayPrice, isPurchasablePrice } from "@/utils/currency";
import NotifyMeButton from "@/components/product/NotifyMeButton";

interface CartEmptyStateProps {
  onBrowse?: () => void;
}

const TRENDING_CATEGORIES = [
  { label: "Guitars", href: categoryPath("guitars") },
  { label: "Live Sound", href: categoryPath("live-sound-lighting") },
  { label: "Drums", href: categoryPath("drums-percussion") },
  { label: "Studio", href: categoryPath("studio-recording") },
  { label: "Keyboards", href: categoryPath("keyboards-synthesizers") },
  { label: "DJ Gear", href: categoryPath("dj-equipment") },
] as const;

function CartSuggestionCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  const outOfStock = product.availability === "out-of-stock";
  const comingSoon = !isPurchasablePrice(product.price);
  const href = `/product/${product.slug}`;
  const hasDeal =
    product.originalPrice != null &&
    product.originalPrice > product.price;

  return (
    <article className="cart-empty__product">
      <Link href={href} className="cart-empty__product-link">
        <div className="cart-empty__product-thumb">
          {product.image ? (
            <StorefrontThumbImage
              src={product.image}
              alt={product.name}
              width={120}
              height={120}
            />
          ) : (
            <span
              className="cart-empty__product-swatch"
              style={{ backgroundColor: product.imageColor }}
              aria-hidden
            />
          )}
        </div>
        <div className="cart-empty__product-copy">
          <p className="cart-empty__product-name">{product.name}</p>
          <p className="cart-empty__product-price">
            {formatDisplayPrice(
              product.originalPrice ?? product.price,
              hasDeal ? product.price : undefined
            )}
            {hasDeal ? (
              <span className="cart-empty__product-deal">Limited deal</span>
            ) : null}
          </p>
        </div>
      </Link>
      {comingSoon ? (
        <NotifyMeButton
          variant="inline"
          className="cart-empty__product-add"
          productId={product.id}
          productSlug={product.slug}
          productName={product.name}
        />
      ) : (
        <button
          type="button"
          className="cart-empty__product-add"
          disabled={outOfStock}
          onClick={() => addItem(product)}
          aria-label={`Add ${product.name} to cart`}
        >
          {outOfStock ? "Sold out" : "Add"}
        </button>
      )}
    </article>
  );
}

export default function CartEmptyState({ onBrowse }: CartEmptyStateProps) {
  const recentlyViewedIds = useRecentlyViewedStore((s) => s.productIds);

  const { data: trending = [], isLoading: trendingLoading } = useQuery({
    queryKey: ["cart-empty-trending"],
    queryFn: () => fetchProducts({ trending: true, limit: 3 }),
    staleTime: 60_000,
  });

  const { data: recentlyViewed = [], isLoading: recentLoading } = useQuery({
    queryKey: ["cart-empty-recent", recentlyViewedIds.slice(0, 6).join(",")],
    queryFn: () => fetchProductSummaries(recentlyViewedIds.slice(0, 6)),
    enabled: recentlyViewedIds.length > 0,
    staleTime: 60_000,
  });

  return (
    <div className="cart-empty">
      <div className="cart-empty__hero">
        <div className="cart-empty__emoji" aria-hidden>
          🎸
        </div>
        <h3 className="cart-empty__title">Your cart is empty</h3>
        <p className="cart-empty__text">
          Discover guitars, studio gear, and pro audio curated for every stage
          and practice room.
        </p>
        <Link
          href={ROUTES.search}
          className="cart-empty__cta"
          onClick={onBrowse}
        >
          Continue Shopping
        </Link>
      </div>

      <section className="cart-empty__categories" aria-label="Trending categories">
        <h4 className="cart-empty__section-label">Trending categories</h4>
        <div className="cart-empty__category-list">
          {TRENDING_CATEGORIES.map((category) => (
            <Link
              key={category.href}
              href={category.href}
              className="cart-empty__category-pill"
              onClick={onBrowse}
            >
              {category.label}
            </Link>
          ))}
        </div>
      </section>

      {recentlyViewed.length > 0 ? (
        <section className="cart-empty__suggestions" aria-label="Recently viewed">
          <h4 className="cart-empty__section-label">Recently viewed</h4>
          {recentLoading ? (
            <div className="cart-empty__suggestions-loading" aria-hidden>
              <div className="cart-skeleton-line" />
            </div>
          ) : (
            <div className="cart-empty__product-list">
              {recentlyViewed.map((product) => (
                <CartSuggestionCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      ) : null}

      <section className="cart-empty__suggestions" aria-label="Popular products">
        <h4 className="cart-empty__section-label">Popular products</h4>
        {trendingLoading ? (
          <div className="cart-empty__suggestions-loading" aria-hidden>
            <div className="cart-skeleton-line" />
            <div className="cart-skeleton-line" />
          </div>
        ) : trending.length > 0 ? (
          <div className="cart-empty__product-list">
            {trending.map((product) => (
              <CartSuggestionCard key={product.id} product={product} />
            ))}
          </div>
        ) : null}
      </section>

      <section className="cart-empty__brands" aria-label="Featured brands">
        <h4 className="cart-empty__section-label">Featured brands</h4>
        <div className="cart-empty__category-list">
          <Link href={ROUTES.brands} className="cart-empty__category-pill" onClick={onBrowse}>
            Shop all brands
          </Link>
          <Link
            href={`${ROUTES.searchResults}?q=roland`}
            className="cart-empty__category-pill"
            onClick={onBrowse}
          >
            Roland
          </Link>
          <Link
            href={`${ROUTES.searchResults}?q=adeon`}
            className="cart-empty__category-pill"
            onClick={onBrowse}
          >
            ADEON
          </Link>
          <Link
            href={`${ROUTES.searchResults}?q=hertz`}
            className="cart-empty__category-pill"
            onClick={onBrowse}
          >
            HERTZ
          </Link>
        </div>
      </section>
    </div>
  );
}
