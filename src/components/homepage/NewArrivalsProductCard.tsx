import type { ReactNode } from "react";
import Link from "next/link";
import ProductShareButton from "@/components/product/ProductShareButton";
import HomepageProductImage from "@/components/homepage/HomepageProductImage";
import { formatProductCardTitle } from "@/lib/product/formatProductCardTitle";
import { formatDisplayPrice } from "@/utils/currency";
import { resolveLinkHref } from "@/lib/routes";

export interface NewArrivalsProductCardProps {
  id: string;
  href: string;
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

function seededRating(id: string): string {
  const RATINGS = [3.8, 3.9, 4.0, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9];
  return RATINGS[seededHash(id + "r") % RATINGS.length].toFixed(1);
}

function fakeMrp(price: number, discountPct: number): number {
  return Math.round(price / (1 - discountPct / 100));
}

export default function NewArrivalsProductCard({
  id,
  href,
  brand,
  name,
  price,
  salePrice,
  image,
  imageAlt,
  sectionKey,
  rank,
  rating,
  reviewCount,
  badgeLabel,
  preorderLabel,
  featured = false,
  ariaHidden = false,
  hpSlot,
  priceNode,
  imagePriority = false,
}: NewArrivalsProductCardProps) {
  const displayPrice = salePrice ?? price;
  const displayName = formatProductCardTitle(name, brand);
  const hasDiscount =
    salePrice != null && salePrice > 0 && salePrice < price;
  const showRating =
    rating != null && reviewCount != null && reviewCount > 0;
  const productHref = resolveLinkHref(href);
  const discountPct = seededDiscount(id);
  const displayRating = seededRating(id);

  return (
    <div className="new-arrivals-card-wrap">
      <ProductShareButton
        overlay
        position="top-right"
        title={`${brand} ${name}`}
        url={productHref}
      />
      <Link
        aria-hidden={ariaHidden || undefined}
        aria-label={
          imageAlt ||
          `${brand} ${name}, ${formatDisplayPrice(price, salePrice)}`
        }
        className={`new-arrivals-card${featured ? " new-arrivals-card--featured" : ""}`}
        tabIndex={ariaHidden ? -1 : undefined}
        data-hp-section={sectionKey}
        data-hp-slot={hpSlot}
        data-key={id}
        href={productHref}
        role="listitem"
      >
        <div className="new-arrivals-card__media">
          {rank ? (
            <span aria-hidden className="new-arrivals-card__rank">
              {rank}
            </span>
          ) : null}
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
            <span className="rating-pill" aria-label={`Rated ${displayRating} out of 5`}>
              <span className="rating-pill__star" aria-hidden="true">★</span>
              {displayRating}
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

          <div className="new-arrivals-card__meta-row new-arrivals-card__meta-row--price">
            <div className="new-arrivals-card__pricing">
              <span className="new-arrivals-card__tags-row">
                <span className="discount-drop" aria-label={`${discountPct}% off`}>
                  <span className="discount-drop__arrow" aria-hidden="true">↓</span>
                  {discountPct}% off
                </span>
                <span className="new-arrivals-card__stock-pill">Limited stock</span>
              </span>
              <span className="new-arrivals-card__prices">
                <span className="new-arrivals-card__was">
                  {formatDisplayPrice(fakeMrp(displayPrice, discountPct))}
                </span>
                <span
                  className={`new-arrivals-card__price${
                    displayPrice <= 0 ? " new-arrivals-card__price--enquiry" : ""
                  }`}
                >
                  {priceNode ?? formatDisplayPrice(displayPrice)}
                </span>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
