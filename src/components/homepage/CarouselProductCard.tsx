import Image from "next/image";
import Link from "next/link";
import { formatProductCardTitle } from "@/lib/product/formatProductCardTitle";
import { formatDisplayPrice } from "@/utils/currency";
import { resolveLinkHref } from "@/lib/routes";
import type { HomepageProductItem } from "@/types/homepage";

interface CarouselProductCardProps {
  item: HomepageProductItem;
  sectionKey: string;
}

function formatRatingAttribute(rating: number): string {
  const rounded = Math.round(rating * 2) / 2;
  return Number.isInteger(rounded) ? rounded.toFixed(1) : String(rounded);
}

export default function CarouselProductCard({
  item,
  sectionKey,
}: CarouselProductCardProps) {
  const ratingAttr = formatRatingAttribute(item.rating);
  const displayName = formatProductCardTitle(item.name, item.brand);

  return (
    <div className="product-suggest__item-wrap">
      <Link
        href={resolveLinkHref(item.href)}
        className="product-suggest__item"
        data-hp-section={sectionKey}
        data-id={item.id}
      >
        <div className="product-suggest__item-img">
          {item.image ? (
            <Image
              alt={item.imageAlt}
              className="product-suggest__item-photo"
              height={400}
              loading="lazy"
              sizes="(max-width: 767px) 45vw, 220px"
              src={item.image}
              width={400}
            />
          ) : null}
        </div>
        <div className="product-suggest__item-content">
          <div className="product-suggest__name" title={item.name}>
            <strong>{item.brand}</strong> {displayName}
          </div>
          <div className="product-suggest__item-price">
            {formatDisplayPrice(item.price, item.salePrice)}
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
              ({item.reviewCount.toLocaleString("en-IN")})
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
