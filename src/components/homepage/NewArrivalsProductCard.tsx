"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import ProductShareButton from "@/components/product/ProductShareButton";
import HomepageProductImage from "@/components/homepage/HomepageProductImage";
import { formatProductCardTitle } from "@/lib/product/formatProductCardTitle";
import {
  ensureProductReviewMetrics,
  formatRatingPillLabel,
} from "@/lib/product/productReviewDisplay";
import { formatDisplayPrice } from "@/utils/currency";
import { resolveLinkHref } from "@/lib/routes";
import {
  canListingQuickAdd,
  listingQuickAddAriaLabel,
  shouldNavigateForVariants,
} from "@/lib/product/listingQuickAdd";
import { useCartStore } from "@/store/cartStore";
import type { Product } from "@/types/product";

export interface NewArrivalsProductCardProps {
  id: string;
  href: string;
  slug?: string;
  brand: string;
  name: string;
  price: number;
  salePrice?: number | null;
  image: string;
  imageAlt: string;
  sectionKey: string;
  rank?: number;
  rating?: number;
  reviewCount?: number;
  badgeLabel?: string;
  preorderLabel?: string;
  featured?: boolean;
  ariaHidden?: boolean;
  hpSlot?: number;
  priceNode?: ReactNode;
  /** Eager-load image for above-the-fold / first marquee cards. */
  imagePriority?: boolean;
  requiresVariantSelection?: boolean;
}

function seededHash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function seededDiscount(id: string): number {
  const DISCOUNTS = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 79];
  return DISCOUNTS[seededHash(id) % DISCOUNTS.length];
}

function fakeMrp(price: number, discountPct: number): number {
  return Math.round(price / (1 - discountPct / 100));
}

function slugFromHref(href: string, fallback: string): string {
  const match = href.match(/\/product\/([^/?#]+)/i);
  return match?.[1] ?? fallback;
}

export default function NewArrivalsProductCard({
  id,
  href,
  slug,
  brand,
  name,
  price,
  salePrice,
  image,
  imageAlt,
  sectionKey,
  rating,
  reviewCount,
  badgeLabel,
  preorderLabel,
  featured = false,
  ariaHidden = false,
  hpSlot,
  priceNode,
  imagePriority = false,
  requiresVariantSelection = false,
}: NewArrivalsProductCardProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const displayPrice = salePrice ?? price;
  const displayName = formatProductCardTitle(name, brand);
  const { rating: displayRating, reviewCount: displayReviewCount } =
    ensureProductReviewMetrics({
      id,
      rating,
      reviewCount,
    });
  const ratingPillLabel = formatRatingPillLabel(displayRating, displayReviewCount);
  const showRating = displayReviewCount > 0;
  const productHref = resolveLinkHref(href);
  const productSlug = slug ?? slugFromHref(href, id);
  const hasRealDiscount =
    salePrice != null && price > displayPrice && displayPrice > 0;
  const discountPct = hasRealDiscount
    ? Math.round(((price - displayPrice) / price) * 100)
    : seededDiscount(id);
  const wasPrice = hasRealDiscount
    ? price
    : fakeMrp(displayPrice, discountPct);
  const cartProduct: Product = {
    id,
    slug: productSlug,
    name,
    brand,
    brandSlug: brand.toLowerCase().replace(/\s+/g, "-"),
    category: "",
    categorySlug: "",
    price: displayPrice,
    originalPrice: price > displayPrice ? price : undefined,
    rating: displayRating,
    reviewCount: displayReviewCount,
    availability: "in-stock",
    condition: "new",
    imageColor: "#e2e8f0",
    image,
    requiresVariantSelection,
  };
  const canBuy = canListingQuickAdd(cartProduct);

  function handleBuy(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!canBuy) return;
    if (shouldNavigateForVariants(cartProduct)) {
      router.push(productHref);
      return;
    }
    addItem(cartProduct);
    openDrawer();
  }

  return (
    <div className="new-arrivals-card-wrap">
      <ProductShareButton
        overlay
        position="top-right"
        title={`${brand} ${name}`}
        url={productHref}
      />
      <div
        aria-hidden={ariaHidden || undefined}
        className={`new-arrivals-card${featured ? " new-arrivals-card--featured" : ""}`}
        data-hp-section={sectionKey}
        data-hp-slot={hpSlot}
        data-key={id}
        role="listitem"
      >
        <Link
          aria-hidden={ariaHidden || undefined}
          aria-label={
            imageAlt ||
            `${brand} ${name}, ${formatDisplayPrice(price, salePrice)}`
          }
          className="new-arrivals-card__link"
          tabIndex={ariaHidden ? -1 : undefined}
          href={productHref}
        >
          <div className="new-arrivals-card__media">
            <div
              className="new-arrivals-card__stock-row"
              aria-label="Limited stock"
            >
              <span aria-hidden className="new-arrivals-card__ribbon">
                Limited stock
              </span>
            </div>
            {badgeLabel ? (
              <span className="new-arrivals-card__badge">{badgeLabel}</span>
            ) : null}
            {image ? (
              <HomepageProductImage
                className="new-arrivals-card__image"
                fill
                height={640}
                priority={!ariaHidden && imagePriority}
                sizes="(max-width: 767px) 46vw, 360px"
                src={image}
                width={640}
              />
            ) : (
              <div
                aria-hidden
                className="new-arrivals-card__image new-arrivals-card__image--placeholder"
              />
            )}
            {showRating ? (
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
          </div>

          <div className="new-arrivals-card__body">
            {preorderLabel ? (
              <p className="new-arrivals-card__preorder">{preorderLabel}</p>
            ) : null}
            <p className="new-arrivals-card__brand">{brand}</p>
            <h3 className="new-arrivals-card__name" title={name}>
              {displayName}
            </h3>

            <span className="new-arrivals-card__tags-row">
              <span className="discount-drop" aria-label={`${discountPct}% off`}>
                <span className="discount-drop__arrow" aria-hidden="true">↓</span>
                {discountPct}% off
              </span>
              <span className="new-arrivals-card__prices">
                <span className="new-arrivals-card__was">
                  {formatDisplayPrice(wasPrice)}
                </span>
                <span
                  className={`new-arrivals-card__price${
                    displayPrice <= 0 ? " new-arrivals-card__price--enquiry" : ""
                  }`}
                >
                  {priceNode ?? formatDisplayPrice(displayPrice)}
                </span>
              </span>
            </span>
          </div>
        </Link>

        <div
          className={`new-arrivals-card__meta-row new-arrivals-card__meta-row--price${
            canBuy ? "" : " new-arrivals-card__meta-row--solo"
          }`}
        >
          {canBuy ? (
            <button
              type="button"
              className="new-arrivals-card__buy"
              onClick={handleBuy}
              tabIndex={ariaHidden ? -1 : undefined}
              aria-hidden={ariaHidden || undefined}
              aria-label={listingQuickAddAriaLabel({
                name,
                requiresVariantSelection,
              })}
            >
              {requiresVariantSelection ? "Choose options" : "Buy Now"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
