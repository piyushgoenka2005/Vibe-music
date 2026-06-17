import type { ReactNode } from "react";
import Link from "next/link";
import { optimizeImageUrl } from "@/lib/images";
import { formatCurrency } from "@/utils/currency";
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
  hpSlot?: number;
  priceNode?: ReactNode;
}

function formatRatingAttribute(rating: number): string {
  const rounded = Math.round(rating * 2) / 2;
  return Number.isInteger(rounded) ? rounded.toFixed(1) : String(rounded);
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
  hpSlot,
  priceNode,
}: NewArrivalsProductCardProps) {
  const displayPrice = salePrice ?? price;
  const hasDiscount =
    salePrice != null && salePrice > 0 && salePrice < price;
  const imageSrc = image ? optimizeImageUrl(image, "productCard") : "";
  const showRating =
    rating != null && reviewCount != null && reviewCount > 0;

  return (
    <Link
      aria-label={`${brand} ${name}, ${formatCurrency(displayPrice)}`}
      className={`new-arrivals-card${featured ? " new-arrivals-card--featured" : ""}`}
      data-hp-section={sectionKey}
      data-hp-slot={hpSlot}
      data-key={id}
      href={resolveLinkHref(href)}
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
        {imageSrc ? (
          <img
            alt={imageAlt}
            className="new-arrivals-card__image"
            decoding="async"
            height={400}
            loading="lazy"
            src={imageSrc}
            width={400}
          />
        ) : (
          <div
            aria-hidden
            className="new-arrivals-card__image new-arrivals-card__image--placeholder"
          />
        )}
      </div>

      <div className="new-arrivals-card__body">
        {preorderLabel ? (
          <p className="new-arrivals-card__preorder">{preorderLabel}</p>
        ) : null}
        <p className="new-arrivals-card__brand">{brand}</p>
        <h3 className="new-arrivals-card__name">{name}</h3>

        {showRating ? (
          <div className="new-arrivals-card__rating">
            <span
              aria-label={`Rated ${rating} out of 5`}
              className="rating__stars"
              data-rated={formatRatingAttribute(rating!)}
            >
              <i></i>
              <i></i>
              <i></i>
              <i></i>
              <i></i>
              <span className="rating__text">
                Rated {rating} out of 5
              </span>
            </span>
            <span className="new-arrivals-card__review-count">
              ({reviewCount!.toLocaleString("en-IN")})
            </span>
          </div>
        ) : null}

        <div className="new-arrivals-card__pricing">
          {hasDiscount ? (
            <span className="new-arrivals-card__was">
              {formatCurrency(price)}
            </span>
          ) : null}
          <span className="new-arrivals-card__price">
            {priceNode ?? formatCurrency(displayPrice)}
          </span>
        </div>
      </div>
    </Link>
  );
}
