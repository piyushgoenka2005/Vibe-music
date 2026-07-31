"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import StorefrontThumbImage from "@/components/common/StorefrontThumbImage";
import { productPath, ROUTES } from "@/lib/routes";
import { fetchProducts } from "@/services/products.api";
import { useWishlistStore } from "@/store/wishlistStore";
import type { Product } from "@/types/product";
import { formatDisplayPrice } from "@/utils/currency";

interface WishlistEmptyStateProps {
  onBrowse?: () => void;
}

function WishlistSuggestionCard({
  product,
  onNavigate,
}: {
  product: Product;
  onNavigate?: () => void;
}) {
  const toggle = useWishlistStore((state) => state.toggle);
  const isSaved = useWishlistStore((state) =>
    state.items.some((item) => item.productId === product.id)
  );
  const href = productPath(product.slug);
  const hasDeal =
    product.originalPrice != null && product.originalPrice > product.price;

  return (
    <article className="wl-empty__product">
      <Link
        href={href}
        className="wl-empty__product-link"
        onClick={onNavigate}
      >
        <div className="wl-empty__product-thumb">
          {product.image ? (
            <StorefrontThumbImage
              src={product.image}
              alt=""
              fill
              width={64}
              height={64}
              className="wl-empty__product-photo"
            />
          ) : (
            <span
              className="wl-empty__product-swatch"
              style={{ backgroundColor: product.imageColor }}
              aria-hidden
            />
          )}
        </div>
        <div className="wl-empty__product-copy">
          <p className="wl-empty__product-brand">{product.brand}</p>
          <p className="wl-empty__product-name">{product.name}</p>
          <p className="wl-empty__product-price">
            {formatDisplayPrice(
              product.originalPrice ?? product.price,
              hasDeal ? product.price : undefined
            )}
            {hasDeal ? (
              <span className="wl-empty__product-deal">Deal</span>
            ) : null}
          </p>
        </div>
      </Link>
      <button
        type="button"
        className={`wl-empty__product-save${
          isSaved ? " wl-empty__product-save--saved" : ""
        }`}
        onClick={() => toggle(product)}
        aria-pressed={isSaved}
        aria-label={
          isSaved ? `Remove ${product.name} from wishlist` : `Save ${product.name}`
        }
      >
        <Heart size={15} fill={isSaved ? "currentColor" : "none"} aria-hidden />
        {isSaved ? "Saved" : "Save"}
      </button>
    </article>
  );
}

export default function WishlistEmptyState({ onBrowse }: WishlistEmptyStateProps) {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["wishlist-empty-suggestions"],
    queryFn: () => fetchProducts({ trending: true, limit: 4 }),
    staleTime: 60_000,
  });

  return (
    <div className="wl-empty">
      <div className="wl-empty__hero">
        <div className="wl-empty__icon" aria-hidden>
          <Heart size={28} strokeWidth={1.75} />
        </div>
        <h3 className="wl-empty__title">Start your wishlist</h3>
        <p className="wl-empty__text">
          Tap the heart on gear you love — we&apos;ll keep it ready for your next
          session, stage, or studio upgrade.
        </p>
        <Link href={ROUTES.search} className="wl-empty__cta" onClick={onBrowse}>
          Browse collection
        </Link>
      </div>

      <section
        className="wl-empty__suggestions"
        aria-label="Suggested for your wishlist"
      >
        <h4 className="wl-empty__suggestions-label">Suggested for you</h4>

        {isLoading ? (
          <div className="wl-empty__suggestions-loading" aria-hidden>
            <div className="wl-skeleton-line" />
            <div className="wl-skeleton-line" />
            <div className="wl-skeleton-line" />
          </div>
        ) : products.length > 0 ? (
          <div className="wl-empty__product-list">
            {products.map((product) => (
              <WishlistSuggestionCard
                key={product.id}
                product={product}
                onNavigate={onBrowse}
              />
            ))}
          </div>
        ) : (
          <p className="wl-empty__fallback">
            Explore{" "}
            <Link href={ROUTES.deals} className="wl-drawer__empty-link" onClick={onBrowse}>
              today&apos;s deals
            </Link>{" "}
            or{" "}
            <Link href={ROUTES.search} className="wl-drawer__empty-link" onClick={onBrowse}>
              new arrivals
            </Link>
            .
          </p>
        )}
      </section>
    </div>
  );
}
