"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import ProductShareButton from "@/components/product/ProductShareButton";
import HomepageProductImage from "@/components/homepage/HomepageProductImage";
import { formatProductCardTitle } from "@/lib/product/formatProductCardTitle";
import {
  ensureProductReviewMetrics,
  formatRatingPillLabel,
} from "@/lib/product/productReviewDisplay";
import { resolveLinkHref } from "@/lib/routes";
import { useCartStore } from "@/store/cartStore";
import type { HomepageProductItem } from "@/types/homepage";
import type { Product } from "@/types/product";
import { formatDisplayPrice, isPurchasablePrice } from "@/utils/currency";
import NotifyMeButton from "@/components/product/NotifyMeButton";

interface CarouselProductCardProps {
  item: HomepageProductItem;
  sectionKey: string;
  imagePriority?: boolean;
}


function toCartProduct(item: HomepageProductItem): Product {
  const price = item.salePrice != null && item.salePrice > 0 ? item.salePrice : item.price;
  const { rating, reviewCount } = ensureProductReviewMetrics({
    id: item.id,
    rating: item.rating,
    reviewCount: item.reviewCount,
  });
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    brand: item.brand,
    brandSlug: item.brand.toLowerCase().replace(/\s+/g, "-"),
    category: "",
    categorySlug: "",
    price,
    originalPrice: item.price > price ? item.price : undefined,
    rating,
    reviewCount,
    availability: "in-stock",
    condition: "new",
    imageColor: "#e2e8f0",
    image: item.image,
  };
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

export default function CarouselProductCard({
  item,
  sectionKey,
  imagePriority = false,
}: CarouselProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const displayName = formatProductCardTitle(item.name, item.brand);
  const displayPrice = item.salePrice ?? item.price;
  const hasDiscount =
    item.salePrice != null && item.salePrice > 0 && item.salePrice < item.price;
  const { rating: displayRating, reviewCount: displayReviewCount } =
    ensureProductReviewMetrics({
      id: item.id,
      rating: item.rating,
      reviewCount: item.reviewCount,
    });
  const ratingPillLabel = formatRatingPillLabel(displayRating, displayReviewCount);
  const showRating = displayReviewCount > 0;
  const badgeLabel =
    item.badgeLabel ?? (sectionKey === "trending" ? "Trending" : undefined);
  const isTrendingRibbon = sectionKey === "trending" && !item.badgeLabel;
  const discountPct = seededDiscount(item.id);
  const productHref = resolveLinkHref(item.href);
  const canQuickAdd = isPurchasablePrice(displayPrice);

  function handleAddToCart(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!canQuickAdd) return;
    addItem(toCartProduct(item));
    openDrawer();
  }

  return (
    <div className="product-suggest__item-wrap">
      <ProductShareButton
        overlay
        position="top-right"
        title={`${item.brand} ${item.name}`}
        url={productHref}
      />
      <div className="product-suggest__item" data-hp-section={sectionKey} data-id={item.id}>
        <Link href={productHref} className="product-suggest__item-link">
          {badgeLabel ? (
            <span
              className={
                isTrendingRibbon
                  ? "product-suggest__item-ribbon"
                  : "product-suggest__item-badge"
              }
            >
              {badgeLabel}
            </span>
          ) : null}
          <div className="product-suggest__item-img">
            <span className="product-suggest__item-img-frame" aria-hidden />
            {item.image ? (
              <span className="product-suggest__item-photo-pop">
                <HomepageProductImage
                  className="product-suggest__item-photo"
                  fill
                  height={480}
                  priority={imagePriority}
                  sizes="(max-width: 767px) 46vw, 280px"
                  src={item.image}
                  width={480}
                />
              </span>
            ) : null}
            {showRating ? (
              <span
                className="rating-pill"
                aria-label={`Rated ${displayRating.toFixed(1)} out of 5 from ${displayReviewCount} ratings`}
              >
                <span className="rating-pill__star" aria-hidden="true">
                  ★
                </span>
                {ratingPillLabel}
              </span>
            ) : null}
          </div>
          <div className="product-suggest__item-content">
            <p className="product-suggest__brand">{item.brand}</p>
            <h3 className="product-suggest__name" title={item.name}>
              {displayName}
            </h3>
          </div>
        </Link>
        <div className="product-suggest__item-footer">
          <div className="product-suggest__item-pricing">
            <div className="product-suggest__item-prices">
              <span className="discount-drop" aria-label={`${discountPct}% off`}>
                <span className="discount-drop__arrow" aria-hidden="true">↓</span>
                {discountPct}% off
              </span>
              <span className="product-suggest__item-was">
                {formatDisplayPrice(fakeMrp(displayPrice, discountPct))}
              </span>
              <span
                className={`product-suggest__item-price${
                  displayPrice <= 0 ? " product-suggest__item-price--enquiry" : ""
                }`}
              >
                {formatDisplayPrice(displayPrice)}
              </span>
            </div>
          </div>
        </div>
        <div className="product-suggest__item-action-row">
          {canQuickAdd ? (
            <button
              type="button"
              className="product-suggest__item-action product-suggest__item-action--button"
              onClick={handleAddToCart}
              aria-label={`Add ${item.name} to cart`}
            >
              Add to cart
            </button>
          ) : (
            <NotifyMeButton
              variant="inline"
              className="product-suggest__item-action product-suggest__item-action--button"
              productId={item.id}
              productSlug={item.slug}
              productName={item.name}
            />
          )}
        </div>
      </div>
    </div>
  );
}
