"use client";

import Link from "next/link";
import type { ProductDetail, ProductVariant } from "@/types/product";

interface ProductInfoProps {
  product: ProductDetail;
  selectedVariant: ProductVariant;
  quantity: number;
  onVariantChange: (variant: ProductVariant) => void;
  onQuantityChange: (qty: number) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  onToggleWishlist: () => void;
  isWishlisted: boolean;
  onReviewsClick: () => void;
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function availabilityClass(av: ProductVariant["availability"]): string {
  return `pdp-availability pdp-availability--${av}`;
}

function availabilityLabel(av: ProductVariant["availability"]): string {
  switch (av) {
    case "in-stock":
      return "In Stock — Ready to Ship";
    case "limited":
      return "Limited Stock — Order Soon";
    case "out-of-stock":
      return "Out of Stock";
  }
}

export default function ProductInfo({
  product,
  selectedVariant,
  quantity,
  onVariantChange,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
  onToggleWishlist,
  isWishlisted,
  onReviewsClick,
}: ProductInfoProps) {
  const displayPrice = selectedVariant.price;
  const onSale = product.salePrice !== null && product.msrp !== null;
  const savings =
    onSale && product.msrp ? product.msrp - displayPrice : 0;

  return (
    <div className="pdp-info">
      <div className="pdp-brand">
        <Link href={`/category/${product.categorySlug}?brand=${product.brandSlug}`}>
          {product.brand}
        </Link>
      </div>

      <h1 className="pdp-title">{product.name}</h1>
      <p className="pdp-sku">
        SKU: <span>{selectedVariant.sku}</span>
      </p>

      <div className="pdp-rating">
        <span className="pdp-rating__stars" aria-hidden="true">
          {"★".repeat(Math.round(product.rating))}
          {"☆".repeat(5 - Math.round(product.rating))}
        </span>
        <span>
          {product.rating.toFixed(1)} ({product.reviewCount} reviews)
        </span>
        <button
          type="button"
          className="pdp-rating__link"
          style={{ border: 0, background: "none", cursor: "pointer", padding: 0 }}
          onClick={onReviewsClick}
        >
          Read Reviews
        </button>
      </div>

      <div className="pdp-pricing">
        {onSale ? (
          <>
            <span className="pdp-msrp">{formatPrice(product.msrp!)}</span>
            <span className="pdp-price pdp-price--sale">
              {formatPrice(displayPrice)}
            </span>
            {savings > 0 ? (
              <div className="pdp-savings">
                Save {formatPrice(savings)} ({Math.round((savings / product.msrp!) * 100)}% off)
              </div>
            ) : null}
          </>
        ) : (
          <span className="pdp-price">{formatPrice(displayPrice)}</span>
        )}
      </div>

      <div className={availabilityClass(selectedVariant.availability)}>
        <span aria-hidden="true">●</span>
        {availabilityLabel(selectedVariant.availability)}
      </div>

      {product.variants.length > 1 ? (
        <div className="pdp-variants">
          <span className="pdp-variants__label" id="variant-label">
            Select Option
          </span>
          <div
            className="pdp-variants__options"
            role="group"
            aria-labelledby="variant-label"
          >
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                className={`pdp-variants__btn${selectedVariant.id === variant.id ? " pdp-variants__btn--active" : ""}`}
                onClick={() => onVariantChange(variant)}
                aria-pressed={selectedVariant.id === variant.id}
              >
                {variant.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="pdp-qty">
        <span className="pdp-qty__label" id="qty-label">
          Quantity
        </span>
        <div className="pdp-qty__control" role="group" aria-labelledby="qty-label">
          <button
            type="button"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            max={99}
            value={quantity}
            onChange={(e) =>
              onQuantityChange(Math.max(1, Math.min(99, Number(e.target.value) || 1)))
            }
            aria-label="Quantity"
          />
          <button
            type="button"
            onClick={() => onQuantityChange(Math.min(99, quantity + 1))}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      <div className="pdp-actions">
        <button
          type="button"
          className="pdp-btn pdp-btn--primary"
          onClick={onAddToCart}
          disabled={selectedVariant.availability === "out-of-stock"}
        >
          Add to Cart
        </button>
        <button
          type="button"
          className="pdp-btn pdp-btn--buy"
          onClick={onBuyNow}
          disabled={selectedVariant.availability === "out-of-stock"}
        >
          Buy Now
        </button>
        <button
          type="button"
          className="pdp-btn pdp-btn--secondary"
          onClick={onToggleWishlist}
          aria-pressed={isWishlisted}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          {isWishlisted ? "♥ Wishlisted" : "♡ Wishlist"}
        </button>
      </div>
    </div>
  );
}
