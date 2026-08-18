"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { formatProductCardTitle } from "@/lib/product/formatProductCardTitle";
import {
  ensureProductReviewMetrics,
  formatRatingPillLabel,
} from "@/lib/product/productReviewDisplay";
import ProductShareButton from "@/components/product/ProductShareButton";
import CompareButton from "@/components/compare/CompareButton";
import WishlistButton from "@/components/wishlist/WishlistButton";
import NotifyMeButton from "@/components/product/NotifyMeButton";
import { formatCurrency, formatDisplayPrice, isPurchasablePrice } from "@/utils/currency";
import { optimizeImageUrl } from "@/lib/storefrontImages";
import {
  trackSelectItem,
  type ItemListContext,
} from "@/lib/analytics/events";
import type { Product } from "@/types/product";
import type { ViewMode } from "@/types/filters";

interface ProductCardProps {
  product: Product;
  view: ViewMode;
  listContext?: ItemListContext;
  listIndex?: number;
  eager?: boolean;
}

function availabilityLabel(availability: Product["availability"]): string {
  switch (availability) {
    case "in-stock":
      return "In Stock";
    case "limited":
      return "Limited";
    case "out-of-stock":
      return "Out of Stock";
  }
}

function availabilityClass(availability: Product["availability"]): string {
  switch (availability) {
    case "in-stock":
      return "cat-product-card__badge--stock";
    case "limited":
      return "cat-product-card__badge--limited";
    case "out-of-stock":
      return "cat-product-card__badge--oos";
  }
}

function conditionLabel(condition: Product["condition"]): string {
  switch (condition) {
    case "used":
      return "Pre-owned";
    case "open-box":
      return "Open box";
    default:
      return "New";
  }
}

function discountPercent(original: number, current: number): number {
  if (original <= 0 || current <= 0 || current >= original) return 0;
  return Math.round(((original - current) / original) * 100);
}

export default function ProductCard({
  product,
  view,
  listContext,
  listIndex,
  eager,
}: ProductCardProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const productHref = `/product/${product.slug}`;
  const { rating: displayRating, reviewCount: displayReviewCount } =
    ensureProductReviewMetrics({
      id: product.id,
      rating: product.rating,
      reviewCount: product.reviewCount,
    });
  const ratingPillLabel = formatRatingPillLabel(displayRating, displayReviewCount);

  function prefetchProduct() {
    try {
      router.prefetch(productHref);
    } catch {
      /* prefetch is best-effort */
    }
  }

  function trackProductSelect() {
    if (!listContext) return;
    trackSelectItem(product, listContext, listIndex);
  }

  function handleAdd() {
    if (product.availability === "out-of-stock" || !isPurchasablePrice(product.price)) {
      return;
    }
    if (product.requiresVariantSelection) {
      trackProductSelect();
      router.push(productHref);
      return;
    }
    addItem(product);
    openDrawer();
  }

  const displayName = formatProductCardTitle(product.name, product.brand)
    .replace(/\s*[—–-]\s*(Open\s*Box|Pre-?owned|Used)\s*$/i, "")
    .trim();
  const originalPrice = product.originalPrice ?? product.price;
  const hasDiscount = originalPrice > product.price && product.price > 0;
  const savingsPercent = discountPercent(originalPrice, product.price);
  const isComingSoon = !isPurchasablePrice(product.price);
  const canQuickAdd =
    product.availability !== "out-of-stock" && isPurchasablePrice(product.price);
  const quickAddLabel = product.requiresVariantSelection
    ? "Choose options"
    : canQuickAdd
      ? "Add to cart"
      : "Out of stock";
  const isGrid = view === "grid";
  const preferredSrc = product.image
    ? optimizeImageUrl(product.image, "productCard")
    : "";
  const imageCandidates = Array.from(
    new Set([preferredSrc, product.image].filter(Boolean))
  );
  const [imageAttempt, setImageAttempt] = useState(0);
  const [imageSrcKey, setImageSrcKey] = useState(preferredSrc);
  if (preferredSrc !== imageSrcKey) {
    setImageSrcKey(preferredSrc);
    setImageAttempt(0);
  }
  const safeImageAttempt =
    preferredSrc === imageSrcKey ? imageAttempt : 0;
  const imageSrc =
    imageCandidates[Math.min(safeImageAttempt, imageCandidates.length - 1)] ??
    "";
  const imageFailed =
    !imageSrc || safeImageAttempt >= imageCandidates.length;

  return (
    <article
      className="cat-product-card"
      data-view={view}
      aria-label={`${product.brand} ${product.name}`}
    >
      <div className="cat-product-card__media-wrap">
        <Link
          href={productHref}
          className="cat-product-card__image"
          aria-hidden="true"
          tabIndex={-1}
          prefetch
          onMouseEnter={prefetchProduct}
          onFocus={prefetchProduct}
          onClick={trackProductSelect}
        >
          {isGrid && savingsPercent > 0 ? (
            <span className="cat-product-card__deal-tag">{savingsPercent}% off</span>
          ) : null}
          {product.condition !== "new" ? (
            <span
              className={`cat-product-card__condition cat-product-card__condition--${product.condition}`}
            >
              {conditionLabel(product.condition)}
            </span>
          ) : null}
          {product.image && !imageFailed ? (
            <Image
              key={product.image}
              src={product.image}
              alt=""
              width={640}
              height={640}
              priority={eager}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="cat-product-card__image-photo"
              onError={() => {
                setImageAttempt((current) => current + 1);
              }}
            />
          ) : null}
          {displayReviewCount > 0 ? (
            <span
              className="rating-pill"
              aria-label={`Rated ${displayRating.toFixed(1)} out of 5`}
            >
              <span className="rating-pill__star" aria-hidden="true">
                ★
              </span>
              {ratingPillLabel}
            </span>
          ) : null}
        </Link>
        <div className="product-card-actions">
          <ProductShareButton
            title={`${product.brand} ${product.name}`}
            url={productHref}
          />
          <CompareButton product={product} />
          <WishlistButton product={product} />
        </div>
      </div>
      <div className="cat-product-card__body">
        {isGrid ? (
          <>
            <div className="cat-product-card__brand cat-product-card__brand--desktop">
              {product.brand}
            </div>
            <span className="cat-product-card__category-pill">{product.category}</span>
          </>
        ) : (
          <div className="cat-product-card__brand">{product.brand}</div>
        )}
        <h3 className="cat-product-card__name">
          <Link
            href={productHref}
            prefetch
            title={product.name}
            onMouseEnter={prefetchProduct}
            onFocus={prefetchProduct}
            onClick={trackProductSelect}
            style={{ color: "inherit", textDecoration: "none" }}
          >
            {displayName}
          </Link>
        </h3>
        {isGrid ? (
          <p className="cat-product-card__descriptor">
            {conditionLabel(product.condition)} · {availabilityLabel(product.availability)}
          </p>
        ) : null}
        {isGrid ? (
          <div className="cat-product-card__price-row">
            <span
              className={`cat-product-card__price cat-product-card__price--sale${
                product.price <= 0 ? " cat-product-card__price--enquiry" : ""
              }`}
            >
              {formatDisplayPrice(product.price)}
            </span>
            {hasDiscount ? (
              <>
                <span className="cat-product-card__price cat-product-card__price--was">
                  {formatCurrency(originalPrice)}
                </span>
                <span className="cat-product-card__discount">{savingsPercent}% off</span>
              </>
            ) : null}
          </div>
        ) : (
          <div className="cat-product-card__meta">
            <div className="cat-product-card__pricing">
              <span
                className={`cat-product-card__price cat-product-card__price--sale${
                  product.price <= 0 ? " cat-product-card__price--enquiry" : ""
                }`}
              >
                {formatDisplayPrice(product.price)}
              </span>
              {hasDiscount ? (
                <span className="cat-product-card__price cat-product-card__price--was">
                  {formatCurrency(originalPrice)}
                </span>
              ) : null}
            </div>
            <span
              className={`cat-product-card__badge ${availabilityClass(product.availability)}`}
            >
              {availabilityLabel(product.availability)}
            </span>
          </div>
        )}
        {isComingSoon ? (
          <NotifyMeButton
            productId={product.id}
            productSlug={product.slug}
            productName={product.name}
          />
        ) : (
          <button
            type="button"
            className="cat-product-card__add"
            onClick={handleAdd}
            disabled={!canQuickAdd}
            aria-label={
              product.requiresVariantSelection
                ? `Choose options for ${product.name}`
                : `Add ${product.name} to cart`
            }
          >
            {quickAddLabel}
          </button>
        )}
      </div>
    </article>
  );
}
