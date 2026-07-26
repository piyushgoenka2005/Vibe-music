"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import ProductShareButton from "@/components/product/ProductShareButton";
import HomepageProductImage from "@/components/homepage/HomepageProductImage";
import { formatProductCardTitle } from "@/lib/product/formatProductCardTitle";
import {
  ensureProductReviewMetrics,
  formatRatingPillLabel,
} from "@/lib/product/productReviewDisplay";
import { resolveLinkHref } from "@/lib/routes";
import {
  canListingQuickAdd,
  listingQuickAddAriaLabel,
  shouldNavigateForVariants,
} from "@/lib/product/listingQuickAdd";
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
    requiresVariantSelection: item.requiresVariantSelection,
  };
}

export default function CarouselProductCard({
  item,
  sectionKey,
  imagePriority = false,
}: CarouselProductCardProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const displayName = formatProductCardTitle(item.name, item.brand);
  const displayPrice = item.salePrice ?? item.price;
  const hasPrice = isPurchasablePrice(displayPrice);
  const hasRealDiscount =
    item.salePrice != null &&
    item.salePrice > 0 &&
    item.price > item.salePrice &&
    displayPrice > 0;
  const discountPct = hasRealDiscount
    ? Math.round(((item.price - item.salePrice!) / item.price) * 100)
    : null;
  const { rating: displayRating, reviewCount: displayReviewCount } =
    ensureProductReviewMetrics({
      id: item.id,
      rating: item.rating,
      reviewCount: item.reviewCount,
    });
  const ratingPillLabel = formatRatingPillLabel(displayRating, displayReviewCount);
  const showRating = displayReviewCount > 0;
  const badgeLabel = item.badgeLabel?.trim() || undefined;
  const isTrendingRibbon = Boolean(badgeLabel && /trend/i.test(badgeLabel));
  const productHref = resolveLinkHref(item.href);
  const cartProduct = toCartProduct(item);
  const canQuickAdd = canListingQuickAdd(cartProduct);

  function handleAddToCart(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!canQuickAdd) return;
    if (shouldNavigateForVariants(cartProduct)) {
      router.push(productHref);
      return;
    }
    addItem(cartProduct);
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
                aria-label={`Rated ${displayRating.toFixed(1)} out of 5`}
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
            <div
              className={`product-suggest__tags-row${
                hasPrice ? "" : " product-suggest__tags-row--enquiry"
              }`}
            >
              {discountPct != null ? (
                <span className="discount-drop" aria-label={`${discountPct}% off`}>
                  <span className="discount-drop__arrow" aria-hidden="true">
                    ↓
                  </span>
                  {discountPct}% off
                </span>
              ) : null}
              <span className="product-suggest__item-prices">
                {hasRealDiscount ? (
                  <span className="product-suggest__item-was">
                    {formatDisplayPrice(item.price)}
                  </span>
                ) : null}
                <span
                  className={`product-suggest__item-price${
                    hasPrice ? "" : " product-suggest__item-price--enquiry"
                  }`}
                >
                  {formatDisplayPrice(displayPrice)}
                </span>
              </span>
            </div>
          </div>
        </Link>
        <div className="product-suggest__item-action-row">
          {canQuickAdd ? (
            <button
              type="button"
              className="new-arrivals-card__buy"
              onClick={handleAddToCart}
              aria-label={listingQuickAddAriaLabel({
                name: item.name,
                requiresVariantSelection: item.requiresVariantSelection,
              })}
            >
              {item.requiresVariantSelection ? "Choose options" : "Buy Now"}
            </button>
          ) : (
            <NotifyMeButton
              variant="inline"
              className="new-arrivals-card__buy"
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
