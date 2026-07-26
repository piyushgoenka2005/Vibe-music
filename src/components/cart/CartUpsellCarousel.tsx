"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StorefrontThumbImage from "@/components/common/StorefrontThumbImage";
import { productPath } from "@/lib/routes";
import {
  canListingQuickAdd,
  listingQuickAddAriaLabel,
  listingQuickAddLabel,
  shouldNavigateForVariants,
} from "@/lib/product/listingQuickAdd";
import { useCartStore } from "@/store/cartStore";
import type { Product } from "@/types/product";
import { formatDisplayPrice } from "@/utils/currency";
import { Star } from "lucide-react";

interface CartUpsellCarouselProps {
  products: Product[];
  title?: string;
}

function discountPercent(product: Product): number | null {
  const original = product.originalPrice;
  if (original == null || original <= product.price) return null;
  return Math.round(((original - product.price) / original) * 100);
}

function isPurchasable(product: Product): boolean {
  return canListingQuickAdd(product);
}

export default function CartUpsellCarousel({
  products,
  title = "Recommended for you",
}: CartUpsellCarouselProps) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const cartProductIds = useMemo(
    () =>
      new Set(
        items
          .filter((item) => !item.isPromoGift)
          .map((item) => item.productId)
      ),
    [items]
  );
  const addItem = useCartStore((s) => s.addItem);

  const visible = products.filter(
    (product) =>
      !cartProductIds.has(product.id) && Boolean(product.slug?.trim())
  );
  if (visible.length === 0) return null;

  return (
    <section className="cart-upsell" aria-label={title}>
      <h2 className="cart-upsell__title">{title}</h2>
      <div className="cart-upsell__track">
        {visible.map((product) => {
          const pct = discountPercent(product);
          const original = product.originalPrice;
          const canAdd = isPurchasable(product);
          const addLabel = listingQuickAddLabel(product);
          const href = productPath(product.slug);

          function handleAdd() {
            if (!canAdd) return;
            if (shouldNavigateForVariants(product)) {
              router.push(href);
              return;
            }
            addItem(product, 1);
          }

          return (
            <article key={product.id} className="cart-upsell__card">
              <Link href={href} className="cart-upsell__link">
                <div className="cart-upsell__media">
                  {product.image ? (
                    <StorefrontThumbImage
                      src={product.image}
                      className="cart-upsell__photo"
                      width={160}
                      height={120}
                    />
                  ) : (
                    <div
                      className="cart-upsell__swatch"
                      style={{ backgroundColor: product.imageColor }}
                      aria-hidden
                    />
                  )}
                </div>
                <div className="cart-upsell__copy">
                  <p className="cart-upsell__name">{product.name}</p>
                  {product.rating > 0 ? (
                    <p className="cart-upsell__rating">
                      <Star size={11} aria-hidden fill="currentColor" />
                      <span>{product.rating.toFixed(1)}</span>
                    </p>
                  ) : null}
                  <div className="cart-upsell__prices">
                    {original != null && original > product.price ? (
                      <span className="cart-upsell__mrp">
                        {formatDisplayPrice(original)}
                      </span>
                    ) : null}
                    <span className="cart-upsell__price">
                      {formatDisplayPrice(product.price)}
                    </span>
                    {pct != null ? (
                      <span className="cart-upsell__discount">{pct}% off</span>
                    ) : null}
                  </div>
                </div>
              </Link>
              <button
                type="button"
                className="cart-upsell__add"
                onClick={handleAdd}
                disabled={!canAdd}
                aria-label={
                  canAdd
                    ? listingQuickAddAriaLabel(product)
                    : `${product.name} is unavailable`
                }
              >
                {canAdd
                  ? shouldNavigateForVariants(product)
                    ? addLabel
                    : "+ Add"
                  : "Unavailable"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
