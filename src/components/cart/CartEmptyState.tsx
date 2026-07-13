"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import StorefrontThumbImage from "@/components/common/StorefrontThumbImage";
import { optimizeImageUrl } from "@/lib/images";
import { productPath, ROUTES } from "@/lib/routes";
import { fetchProducts } from "@/services/products.api";
import { useCartStore } from "@/store/cartStore";
import type { Product } from "@/types/product";
import { formatDisplayPrice } from "@/utils/currency";

interface CartEmptyStateProps {
  onBrowse?: () => void;
}

function CartSuggestionCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  const outOfStock = product.availability === "out-of-stock";
  const href = productPath(product.slug);
  const hasDeal =
    product.originalPrice != null &&
    product.originalPrice > product.price;

  return (
    <article className="cart-empty__product">
      <Link href={href} className="cart-empty__product-link">
        <div className="cart-empty__product-thumb">
          {product.image ? (
            <StorefrontThumbImage
              src={optimizeImageUrl(product.image, "productCard")}
              width={72}
              height={72}
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
            {hasDeal ? <span className="cart-empty__product-deal">Limited deal</span> : null}
          </p>
        </div>
      </Link>
      <button
        type="button"
        className="cart-empty__product-add"
        disabled={outOfStock}
        onClick={() => addItem(product)}
        aria-label={`Add ${product.name} to cart`}
      >
        {outOfStock ? "Sold out" : "Add"}
      </button>
    </article>
  );
}

export default function CartEmptyState({ onBrowse }: CartEmptyStateProps) {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["cart-empty-suggestions"],
    queryFn: () => fetchProducts({ trending: true, limit: 3 }),
    staleTime: 60_000,
  });

  return (
    <div className="cart-empty">
      <div className="cart-empty__hero">
        <div className="cart-empty__emoji" aria-hidden>
          😔
        </div>
        <h3 className="cart-empty__title">Your cart looks empty</h3>
        <p className="cart-empty__text">
          Explore guitars, studio gear, and pro audio curated for every stage and
          practice room.
        </p>
        <Link
          href={ROUTES.search}
          className="cart-empty__cta"
          onClick={onBrowse}
        >
          Browse collection
        </Link>
      </div>

      <section className="cart-empty__suggestions" aria-label="Popular right now">
        <h4 className="cart-empty__suggestions-label">Popular right now</h4>

        {isLoading ? (
          <div className="cart-empty__suggestions-loading" aria-hidden>
            <div className="cart-skeleton-line" />
            <div className="cart-skeleton-line" />
            <div className="cart-skeleton-line" />
          </div>
        ) : products.length > 0 ? (
          <div className="cart-empty__product-list">
            {products.map((product) => (
              <CartSuggestionCard key={product.id} product={product} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
