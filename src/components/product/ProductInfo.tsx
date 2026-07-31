"use client";

import Link from "next/link";
import {
  attributeKey,
  findVariantBySelection,
  getVariantAttributeGroups,
} from "@/lib/variants";
import type { ProductDetail, ProductVariant } from "@/types/product";
import { ensureProductReviewMetrics } from "@/lib/product/productReviewDisplay";
import CompareButton from "@/components/compare/CompareButton";
import ProductShareButton from "./ProductShareButton";
import ProductPriceOffers from "./ProductPriceOffers";
import ProductPurchaseAssurances from "./ProductPurchaseAssurances";

interface ProductInfoProps {
  product: ProductDetail;
  selectedVariant: ProductVariant;
  attributeSelection: Record<string, string>;
  onAttributeChange: (key: string, value: string) => void;
  onReviewsClick: () => void;
  liveRating?: number;
  liveReviewCount?: number;
}

function isHexColor(value: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
}

export default function ProductInfo({
  product,
  selectedVariant,
  attributeSelection,
  onAttributeChange,
  onReviewsClick,
  liveRating,
  liveReviewCount,
}: ProductInfoProps) {
  const { rating: ratingValue, reviewCount: reviewCountValue } =
    ensureProductReviewMetrics({
      id: product.id,
      rating: liveRating ?? product.rating,
      reviewCount: liveReviewCount ?? product.reviewCount,
    });
  const hasReviews = reviewCountValue > 0;
  const attributeGroups = getVariantAttributeGroups(product.variants);

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
          {hasReviews ? (
            <>
              <span className="pdp-rating__stars" aria-hidden="true">
                {"★".repeat(Math.round(ratingValue))}
                {"☆".repeat(5 - Math.round(ratingValue))}
              </span>
              <button
                type="button"
                className="pdp-rating__link"
                onClick={onReviewsClick}
              >
                {reviewCountValue}{" "}
                {reviewCountValue === 1 ? "review" : "reviews"}
              </button>
              <span className="pdp-meta-separator" aria-hidden="true">
                |
              </span>
            </>
          ) : null}
          <button
            type="button"
            className="pdp-rating__link"
            onClick={onReviewsClick}
          >
            {hasReviews ? "Write your review" : "Be the first to review"}
          </button>
        </div>
        <div className="pdp-meta-actions">
          <ProductShareButton
            title={`${product.brand} ${product.name}`}
            url={`/product/${product.slug}`}
            showLabel
            className="pdp-meta-share"
          />
          <CompareButton product={product} className="pdp-meta-compare" size={16} />
          <span className="pdp-meta-separator" aria-hidden="true">|</span>
          <span className="pdp-sku">Item ID: {selectedVariant.sku}</span>
        </div>
      </div>

      <ProductPriceOffers product={product} selectedVariant={selectedVariant} />

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
                    const isDisabled =
                      !candidate || candidate.availability === "out-of-stock";

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

      <ProductPurchaseAssurances />
    </div>
  );
}
