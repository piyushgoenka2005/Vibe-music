import Link from "next/link";
import Image from "next/image";
import ProductShareButton from "@/components/product/ProductShareButton";
import { optimizeImageUrl } from "@/lib/images";
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
  const displayName = formatProductCardTitle(item.name, item.brand);
  const displayPrice = item.salePrice ?? item.price;
  const hasDiscount =
    item.salePrice != null && item.salePrice > 0 && item.salePrice < item.price;
  const showRating = item.reviewCount > 0;
  const imageSrc = item.image ? optimizeImageUrl(item.image, "productCard") : "";
  const badgeLabel =
    item.badgeLabel ?? (sectionKey === "trending" ? "Trending" : undefined);
  const isTrendingRibbon = sectionKey === "trending" && !item.badgeLabel;
  const productHref = resolveLinkHref(item.href);

  return (
    <div className="product-suggest__item-wrap">
      <ProductShareButton
        overlay
        position="top-right"
        title={`${item.brand} ${item.name}`}
        url={productHref}
      />
      <Link
        href={productHref}
        className="product-suggest__item"
        data-hp-section={sectionKey}
        data-id={item.id}
      >
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
          {imageSrc ? (
            <Image
              alt={item.imageAlt}
              className="product-suggest__item-photo"
              height={400}
              loading="lazy"
              sizes="(max-width: 767px) 45vw, 240px"
              src={imageSrc}
              width={400}
            />
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
            <span className="product-suggest__item-action">View</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
