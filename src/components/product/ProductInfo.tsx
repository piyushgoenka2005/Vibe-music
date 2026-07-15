"use client";

import type { RefObject } from "react";
import Link from "next/link";
import { formatDisplayPrice, isPurchasablePrice } from "@/utils/currency";
import {
  attributeKey,
  findVariantBySelection,
  getVariantAttributeGroups,
} from "@/lib/variants";
import type { ProductDetail, ProductVariant } from "@/types/product";
import ProductShareButton from "./ProductShareButton";
import ProductTrustBadges from "./ProductTrustBadges";
import NotifyMeButton from "./NotifyMeButton";

interface ProductInfoProps {
  product: ProductDetail;
  selectedVariant: ProductVariant;
  quantity: number;
  attributeSelection: Record<string, string>;
  onAttributeChange: (key: string, value: string) => void;
  onQuantityChange: (qty: number) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  onToggleWishlist: () => void;
  isWishlisted: boolean;
  onReviewsClick: () => void;
  liveRating?: number;
  liveReviewCount?: number;
  atcSentinelRef?: RefObject<HTMLDivElement | null>;
}

function formatPrice(value: number): string {
  return formatDisplayPrice(value);
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

function isHexColor(value: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
}

function hasLimitedDeal(product: ProductDetail, displayPrice: number): boolean {
  if (product.msrp === null) return false;
  if (displayPrice < product.msrp) return true;
  return product.salePrice !== null && product.salePrice < product.msrp;
}

export default function ProductInfo({
  product,
  selectedVariant,
  quantity,
  attributeSelection,
  onAttributeChange,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
  onToggleWishlist,
  isWishlisted,
  onReviewsClick,
  liveRating,
  liveReviewCount,
  atcSentinelRef,
}: ProductInfoProps) {
  const displayPrice = selectedVariant.price;
  const canPurchase =
    isPurchasablePrice(displayPrice) &&
    selectedVariant.availability !== "out-of-stock";
  const isComingSoon = !isPurchasablePrice(displayPrice);
  const ratingValue = liveRating ?? product.rating;
  const reviewCountValue = liveReviewCount ?? product.reviewCount;
  const onSale = product.salePrice !== null && product.msrp !== null;
  const showLimitedDeal = hasLimitedDeal(product, displayPrice);
  const savings =
    onSale && product.msrp ? product.msrp - displayPrice : 0;
  const attributeGroups = getVariantAttributeGroups(product.variants);
  const maxQuantity = Math.max(1, Math.min(99, selectedVariant.stock || 99));

  return (
    <div className="pdp-info">
      <div className="pdp-brand">
        <Link href={`/category/${product.categorySlug}?brand=${product.brandSlug}`}>
          {product.brand}
        </Link>
      </div>

      <h1 className="pdp-title">{product.name}</h1>

      <div className="pdp-meta-row">
        <div className="pdp-rating">
          <span className="pdp-rating__stars" aria-hidden="true">
            {"★".repeat(Math.round(ratingValue))}
            {"☆".repeat(5 - Math.round(ratingValue))}
          </span>
          <button
            type="button"
            className="pdp-rating__link"
            onClick={onReviewsClick}
          >
            {reviewCountValue} {reviewCountValue === 1 ? "review" : "reviews"}
          </button>
          <span className="pdp-meta-separator" aria-hidden="true">|</span>
          <button
            type="button"
            className="pdp-rating__link"
            onClick={onReviewsClick}
          >
            Write your review
          </button>
        </div>
        <div className="pdp-meta-actions">
          <ProductShareButton
            title={`${product.brand} ${product.name}`}
            url={`/product/${product.slug}`}
            showLabel
            className="pdp-meta-share"
          />
          <span className="pdp-meta-separator" aria-hidden="true">|</span>
          <span className="pdp-sku">
            Item ID: {selectedVariant.sku}
          </span>
        </div>
      </div>

      {showLimitedDeal ? (
        <span className="pdp-deal-badge">Limited Deal</span>
      ) : null}

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

      {selectedVariant.availability !== "in-stock" && (
        <div className={availabilityClass(selectedVariant.availability)}>
          <span aria-hidden="true">●</span>
          {availabilityLabel(selectedVariant.availability)}
        </div>
      )}

      {attributeGroups.length > 0 ? (
        <div className="pdp-variants">
          {attributeGroups.map((group) => {
            const key = `${group.type}:${group.name}`;
            const selectedValue = attributeSelection[key] ?? "";

            return (
              <div key={key} className="pdp-variant-group">
                <span className="pdp-variants__label">
                  {group.name}
                  {selectedValue ? `: ${selectedValue}` : ""}
                </span>
                <div className="pdp-variants__options" role="group" aria-label={group.name}>
                  {group.values.map((value) => {
                    const isActive = selectedValue === value;
                    const candidate = findVariantBySelection(product.variants, {
                      ...attributeSelection,
                      [key]: value,
                    });
                    const isDisabled = !candidate || candidate.availability === "out-of-stock";

                    if (group.type === "color") {
                      return (
                        <button
                          key={value}
                          type="button"
                          className={`pdp-variants__swatch${isActive ? " pdp-variants__swatch--active" : ""}`}
                          onClick={() => onAttributeChange(key, value)}
                          aria-pressed={isActive}
                          aria-label={value}
                          disabled={isDisabled}
                          title={value}
                          style={
                            isHexColor(value)
                              ? { backgroundColor: value }
                              : undefined
                          }
                        >
                          {!isHexColor(value) ? value : null}
                        </button>
                      );
                    }

                    return (
                      <button
                        key={value}
                        type="button"
                        className={`pdp-variants__btn${isActive ? " pdp-variants__btn--active" : ""}`}
                        onClick={() => onAttributeChange(key, value)}
                        aria-pressed={isActive}
                        disabled={isDisabled}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : product.variants.length > 1 ? (
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
                onClick={() => {
                  const selection: Record<string, string> = {};
                  variant.attributes.forEach((attr) => {
                    selection[attributeKey(attr)] = attr.value;
                  });
                  Object.entries(selection).forEach(([attrKey, value]) =>
                    onAttributeChange(attrKey, value)
                  );
                }}
                aria-pressed={selectedVariant.id === variant.id}
                disabled={variant.availability === "out-of-stock"}
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
            max={maxQuantity}
            value={quantity}
            onChange={(e) =>
              onQuantityChange(
                Math.max(1, Math.min(maxQuantity, Number(e.target.value) || 1))
              )
            }
            aria-label="Quantity"
          />
          <button
            type="button"
            onClick={() => onQuantityChange(Math.min(maxQuantity, quantity + 1))}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      <div ref={atcSentinelRef} className="pdp-actions">
        {isComingSoon ? (
          <>
            <NotifyMeButton
              variant="pdp-primary"
              productId={product.id}
              productSlug={product.slug}
              productName={product.name}
            />
            <div className="pdp-actions__row">
              <button
                type="button"
                className="pdp-btn pdp-btn--secondary pdp-btn--wishlist"
                onClick={onToggleWishlist}
                aria-pressed={isWishlisted}
                aria-label={
                  isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                }
              >
                {isWishlisted ? "♥ Wishlisted" : "♡ Wishlist"}
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              className="pdp-btn pdp-btn--buy pdp-buy-now"
              onClick={onBuyNow}
              disabled={!canPurchase}
            >
              Buy Now
            </button>
            <div className="pdp-actions__row">
              <button
                type="button"
                className="pdp-btn pdp-btn--primary"
                onClick={onAddToCart}
                disabled={!canPurchase}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{marginRight: 6, verticalAlign: "middle"}}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                Add to Cart
              </button>
              <button
                type="button"
                className="pdp-btn pdp-btn--secondary pdp-btn--wishlist"
                onClick={onToggleWishlist}
                aria-pressed={isWishlisted}
                aria-label={
                  isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                }
              >
                {isWishlisted ? "♥ Wishlisted" : "♡ Wishlist"}
              </button>
            </div>
          </>
        )}
      </div>

      <ProductTrustBadges />
    </div>
  );
}
