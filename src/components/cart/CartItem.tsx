"use client";

import Link from "next/link";
import StorefrontThumbImage from "@/components/common/StorefrontThumbImage";
import { cartItemToProduct } from "@/lib/cart/cartItemToProduct";
import { isPromoGiftLine } from "@/lib/cart/promoGift";
import { productPath } from "@/lib/routes";
import { formatCurrency, formatDisplayPrice } from "@/utils/currency";
import { useCartStore, type CartItem as CartItemType } from "@/store/cartStore";
import { useToastStore } from "@/store/toastStore";
import { useWishlistStore } from "@/store/wishlistStore";

interface CartItemProps {
  item: CartItemType;
  compact?: boolean;
}

function discountPercent(price: number, originalPrice?: number): number | null {
  if (originalPrice == null || originalPrice <= price) return null;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

export default function CartItem({ item, compact = false }: CartItemProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const isUpdating = useCartStore((s) => s.isUpdating);
  const addToWishlist = useWishlistStore((s) => s.add);
  const isInWishlist = useWishlistStore((s) => s.has(item.productId));

  const isGift = isPromoGiftLine(item);
  const slug = item.slug?.trim() || "";
  const productHref = slug ? productPath(slug) : null;
  const imageColor = item.imageColor ?? "#f2f1f0";
  const image = item.image;
  const pct = discountPercent(item.price, item.originalPrice);
  const showOriginal =
    !isGift && item.originalPrice != null && item.originalPrice > item.price;
  const atMaxQty = item.quantity >= 99;

  function handleMoveToWishlist() {
    if (!slug) {
      useToastStore
        .getState()
        .show("This item can’t be saved to wishlist right now.", "error");
      return;
    }
    if (!isInWishlist) {
      addToWishlist(cartItemToProduct(item));
    } else {
      useToastStore
        .getState()
        .show(`${item.name} is already in your wishlist`, "info");
    }
    removeItem(item.lineId, { silent: true });
  }

  const priceLabel = isGift ? "FREE" : formatDisplayPrice(item.price);

  return (
    <article
      className={`cart-item-card${isGift ? " cart-item-card--gift" : ""}${isUpdating ? " cart-item-card--loading" : ""}`}
      aria-label={`${item.brand} ${item.name}`}
      aria-busy={isUpdating || undefined}
    >
      <div className="cart-item-card__media">
        {productHref ? (
          <Link href={productHref} className="cart-item-card__media-link">
            {image ? (
              <StorefrontThumbImage
                src={image}
                className="cart-item-card__photo"
                width={80}
                height={80}
              />
            ) : (
              <div
                className="cart-item-card__swatch"
                style={{ backgroundColor: imageColor }}
                aria-hidden="true"
              />
            )}
          </Link>
        ) : image ? (
          <StorefrontThumbImage
            src={image}
            className="cart-item-card__photo"
            width={80}
            height={80}
          />
        ) : (
          <div
            className="cart-item-card__swatch"
            style={{ backgroundColor: imageColor }}
            aria-hidden="true"
          />
        )}
        {pct != null && !isGift ? (
          <span className="cart-item-card__badge">{pct}% OFF</span>
        ) : null}
        {isGift ? (
          <span className="cart-item-card__badge cart-item-card__badge--gift">
            Free Gift
          </span>
        ) : null}
      </div>

      <div className="cart-item-card__content">
        <div className="cart-item-card__top">
          <div className="cart-item-card__copy">
            {!isGift ? (
              <div className="cart-item-card__brand">{item.brand}</div>
            ) : null}
            {item.variantLabel && !isGift ? (
              <div className="cart-item-card__variant">{item.variantLabel}</div>
            ) : null}
            {item.variantSku && !isGift ? (
              <div className="cart-item-card__sku">SKU: {item.variantSku}</div>
            ) : null}
            {isGift || !productHref ? (
              <div className="cart-item-card__name">{item.name}</div>
            ) : (
              <Link href={productHref} className="cart-item-card__name">
                {item.name}
              </Link>
            )}
            {!isGift ? (
              <p className="cart-item-card__availability">In stock · Ships fast</p>
            ) : (
              <p className="cart-item-card__gift-reason">
                Unlocked with your order value
              </p>
            )}
          </div>

          <div className="cart-item-card__price-col">
            <div className="cart-item-card__price">{priceLabel}</div>
            {showOriginal ? (
              <div className="cart-item-card__mrp">
                {formatDisplayPrice(item.originalPrice!)}
              </div>
            ) : null}
            {!compact && !isGift && item.price > 0 ? (
              <div className="cart-item-card__line-total">
                {formatCurrency(item.price * item.quantity)}
              </div>
            ) : null}
          </div>
        </div>

        <div className="cart-item-card__bottom">
          {isGift ? (
            <span className="cart-item-card__gift-note">Included with your order</span>
          ) : (
            <>
              <div className="cart-qty cart-qty--compact" role="group" aria-label="Quantity">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                  aria-label="Decrease quantity"
                  disabled={isUpdating}
                >
                  −
                </button>
                <span aria-live="polite">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                  aria-label="Increase quantity"
                  disabled={isUpdating || atMaxQty}
                >
                  +
                </button>
              </div>
              <div className="cart-item-card__actions">
                <button
                  type="button"
                  className="cart-item-card__action"
                  onClick={() => removeItem(item.lineId)}
                  disabled={isUpdating}
                >
                  Remove
                </button>
                <button
                  type="button"
                  className="cart-item-card__action"
                  onClick={handleMoveToWishlist}
                  disabled={isUpdating}
                >
                  Save to wishlist
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
