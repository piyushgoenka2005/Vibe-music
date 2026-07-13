import type { ReactNode } from "react";
import Link from "next/link";
import ProductShareButton from "@/components/product/ProductShareButton";
import HomepageProductImage from "@/components/homepage/HomepageProductImage";
import { optimizeImageUrl } from "@/lib/images";
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
  imageAlt: _imageAlt,
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
  const imageSrc = image ? optimizeImageUrl(image, "productCard") : "";
  const showRating =
    rating != null && reviewCount != null && reviewCount > 0;
  const productHref = resolveLinkHref(href);

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
      aria-label={`${brand} ${name}, ${formatDisplayPrice(price, salePrice)}`}
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
        {imageSrc && !ariaHidden ? (
          <HomepageProductImage
            className="new-arrivals-card__image"
            height={400}
            priority={imagePriority}
            sizes="(max-width: 767px) 45vw, 280px"
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
        <h3 className="new-arrivals-card__name" title={name}>
          {displayName}
        </h3>

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
          </div>
        ) : null}

        <div className="new-arrivals-card__meta-row new-arrivals-card__meta-row--price">
          <div className="new-arrivals-card__pricing">
            {hasDiscount ? (
              <span className="new-arrivals-card__was">
                {formatDisplayPrice(price)}
              </span>
            ) : null}
            <span
              className={`new-arrivals-card__price${
                displayPrice <= 0 ? " new-arrivals-card__price--enquiry" : ""
              }`}
            >
              {priceNode ?? formatDisplayPrice(price, salePrice)}
            </span>
          </div>
          <span className="new-arrivals-card__stock-pill">Limited stock</span>
        </div>
      </div>
    </Link>
    </div>
  );
}
