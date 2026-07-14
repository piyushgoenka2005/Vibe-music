"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import ProductShareButton from "@/components/product/ProductShareButton";
import HomepageProductImage from "@/components/homepage/HomepageProductImage";
import { formatProductCardTitle } from "@/lib/product/formatProductCardTitle";
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

function formatRatingAttribute(rating: number): string {
  const rounded = Math.round(rating * 2) / 2;
  return Number.isInteger(rounded) ? rounded.toFixed(1) : String(rounded);
}

function toCartProduct(item: HomepageProductItem): Product {
  const price = item.salePrice != null && item.salePrice > 0 ? item.salePrice : item.price;
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
    rating: item.rating,
    reviewCount: item.reviewCount,
    availability: "in-stock",
    condition: "new",
    imageColor: "#e2e8f0",
    image: item.image,
  };
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
  const showRating = item.reviewCount > 0;
  const badgeLabel =
    item.badgeLabel ?? (sectionKey === "trending" ? "Trending" : undefined);
  const isTrendingRibbon = sectionKey === "trending" && !item.badgeLabel;
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
          </div>
          <div className="product-suggest__item-content">
            <p className="product-suggest__brand">{item.brand}</p>
            <h3 className="product-suggest__name" title={item.name}>
              {displayName}
            </h3>

            {showRating ? (
              <div className="product-suggest__item-reviews">
                <span
                  className="rating__stars"
                  data-rated={formatRatingAttribute(item.rating)}
                  aria-label={`Rated ${item.rating} out of 5`}
                >
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                  <span className="rating__text">
                    Rated {item.rating} out of 5
                  </span>
                </span>
                <span className="product-suggest__item-review-count-inline">
                  ({item.reviewCount.toLocaleString("en-IN")})
                </span>
              </div>
            ) : (
              <p className="product-suggest__item-availability">In stock</p>
            )}
          </div>
        </Link>
        <div className="product-suggest__item-footer">
          <div className="product-suggest__item-pricing">
            {hasDiscount ? (
              <span className="product-suggest__item-was">
                {formatDisplayPrice(item.price)}
              </span>
            ) : null}
            <span
              className={`product-suggest__item-price${
                displayPrice <= 0 ? " product-suggest__item-price--enquiry" : ""
              }`}
            >
              {formatDisplayPrice(item.price, item.salePrice)}
            </span>
          </div>
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
