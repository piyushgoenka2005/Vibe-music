import Link from "next/link";
import { LegacySupPrice } from "@/lib/legacySupPrice";
import { resolveLinkHref } from "@/lib/routes";
import type { SuggestedProductItem } from "@/data/suggestedProducts";

interface SuggestedProductCardProps {
  item: SuggestedProductItem;
}

function formatRatingAttribute(rating: number): string {
  const rounded = Math.round(rating * 2) / 2;
  return Number.isInteger(rounded) ? rounded.toFixed(1) : String(rounded);
}

export default function SuggestedProductCard({ item }: SuggestedProductCardProps) {
  const ratingAttr = formatRatingAttribute(item.rating);

  return (
    <div className="product-suggest__item-wrap">
      <Link
        href={resolveLinkHref(item.href)}
        className="product-suggest__item"
        data-hp-section="product-suggest"
        data-hp-slot={item.slotPosition}
        data-id={item.id}
      >
        <div className="product-suggest__item-img">
          <img
            src={item.imageSrc}
            alt={item.imageAlt}
            loading="lazy"
          />
        </div>
        <div className="product-suggest__item-content">
          <div className="product-suggest__name">
            <strong>{item.brand}</strong> {item.title}
          </div>
          <div className="product-suggest__item-price">
            <LegacySupPrice usd={item.priceUsd} />
          </div>
          <div className="product-suggest__item-reviews">
            <span
              className="rating__stars"
              data-rated={ratingAttr}
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
              ({item.reviewCount.toLocaleString("en-US")})
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
