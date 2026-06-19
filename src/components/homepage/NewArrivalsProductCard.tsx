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

type DealPillTone = "hot" | "best" | "save" | "top" | "trending";

function getDealHighlights({
  sectionKey,
  price,
  salePrice,
  rating,
  reviewCount,
  rank,
  badgeLabel,
}: {
  sectionKey: string;
  price: number;
  salePrice?: number | null;
  rating?: number;
  reviewCount?: number;
  rank?: number;
  badgeLabel?: string;
}): {
  ratingPill: { label: string; tone: DealPillTone };
  pricePill: { label: string; tone: DealPillTone };
} {
  const hasDiscount =
    salePrice != null && salePrice > 0 && salePrice < price;
  const discountPct = hasDiscount
    ? Math.round((1 - salePrice! / price) * 100)
    : 0;

  let ratingLabel = "Hot Deal";
  let ratingTone: DealPillTone = "hot";

  if (badgeLabel) {
    ratingLabel = badgeLabel;
    ratingTone = "hot";
  } else if (rank != null && rank <= 3) {
    ratingLabel = "Best Seller";
    ratingTone = "best";
  } else if (rating != null && rating >= 4.6 && (reviewCount ?? 0) >= 800) {
    ratingLabel = "Top Rated";
    ratingTone = "top";
  } else if (sectionKey === "trending") {
    ratingLabel = "Trending";
    ratingTone = "trending";
  } else if (sectionKey === "staff_picks") {
    ratingLabel = "Staff Pick";
    ratingTone = "top";
  } else if (hasDiscount && discountPct >= 12) {
    ratingLabel = "Hot Deal";
    ratingTone = "hot";
  } else if (sectionKey === "best_sellers") {
    ratingLabel = "Best Seller";
    ratingTone = "best";
  }

  let priceLabel = "Best Deal";
  let priceTone: DealPillTone = "best";

  if (hasDiscount && discountPct >= 8) {
    priceLabel = `${discountPct}% OFF`;
    priceTone = "save";
  } else if (hasDiscount) {
    priceLabel = "Best Deal";
    priceTone = "best";
  } else if (sectionKey === "deals_of_the_day") {
    priceLabel = "Hot Deal";
    priceTone = "hot";
  } else if (rank != null && rank <= 5) {
    priceLabel = "Best Deal";
    priceTone = "best";
  } else {
    priceLabel = "Hot Deal";
    priceTone = "hot";
  }

  return {
    ratingPill: { label: ratingLabel, tone: ratingTone },
    pricePill: { label: priceLabel, tone: priceTone },
  };
}

function DealPill({ label, tone }: { label: string; tone: DealPillTone }) {
  return (
    <span className={`new-arrivals-card__deal-pill new-arrivals-card__deal-pill--${tone}`}>
      {label}
    </span>
  );
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
  const { ratingPill, pricePill } = getDealHighlights({
    sectionKey,
    price,
    salePrice,
    rating,
    reviewCount,
    rank,
    badgeLabel,
  });

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
          <div className="new-arrivals-card__meta-row">
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
            <DealPill label={ratingPill.label} tone={ratingPill.tone} />
          </div>
        ) : (
          <div className="new-arrivals-card__meta-row new-arrivals-card__meta-row--solo">
            <DealPill label={ratingPill.label} tone={ratingPill.tone} />
          </div>
        )}

        <div className="new-arrivals-card__meta-row new-arrivals-card__meta-row--price">
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
          <DealPill label={pricePill.label} tone={pricePill.tone} />
        </div>
      </div>
    </Link>
  );
}
