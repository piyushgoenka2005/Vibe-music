"use client";

import Link from "next/link";
import { formatCurrency } from "@/utils/currency";
import { useCartStore, type CartItem as CartItemType } from "@/store/cartStore";

interface CartItemProps {
  item: CartItemType;
  compact?: boolean;
}

export default function CartItem({ item, compact = false }: CartItemProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const isUpdating = useCartStore((s) => s.isUpdating);

  const lineTotal = item.price * item.quantity;
  const slug = item.slug ?? "#";
  const imageColor = item.imageColor ?? "#f2f1f0";
  const image = item.image;

  return (
    <article
      className={`cart-item${isUpdating ? " cart-item--loading" : ""}`}
      aria-label={`${item.brand} ${item.name}`}
    >
      {image ? (
        <img src={image} alt="" className="cart-item__photo" />
      ) : (
        <div
          className="cart-item__swatch"
          style={{ backgroundColor: imageColor }}
          aria-hidden="true"
        />
      )}
      <div>
        <div className="cart-item__brand">{item.brand}</div>
        {item.variantLabel ? (
          <div className="cart-item__variant">{item.variantLabel}</div>
        ) : null}
        <Link
          href={`/product/${slug}`}
          className="cart-item__name"
        >
          {item.name}
        </Link>
        <div className="cart-item__price">
          {formatCurrency(item.price)}
          {!compact ? (
            <span style={{ fontWeight: 400, color: "#807f7e", fontSize: 13 }}>
              {" "}
              × {item.quantity} = {formatCurrency(lineTotal)}
            </span>
          ) : null}
        </div>
        <div className="cart-item__row">
          <div className="cart-qty" role="group" aria-label="Quantity">
            <button
              type="button"
              onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span aria-live="polite">{item.quantity}</span>
            <button
              type="button"
              onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <button
            type="button"
            className="cart-item__remove"
            onClick={() => removeItem(item.lineId)}
          >
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}
