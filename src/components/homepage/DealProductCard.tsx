import Link from "next/link";
import ProductShareButton from "@/components/product/ProductShareButton";
import { formatProductCardTitle } from "@/lib/product/formatProductCardTitle";
import { resolveDealBadgeLabel } from "@/lib/product/resolveDealBadgeLabel";
import { formatDisplayPrice } from "@/utils/currency";
import { resolveLinkHref } from "@/lib/routes";
import type { HomepageProductItem } from "@/types/homepage";

interface DealProductCardProps {
  item: HomepageProductItem;
  slotPosition: number;
}

export default function DealProductCard({ item, slotPosition }: DealProductCardProps) {
  const displayName = formatProductCardTitle(item.name, item.brand);
  const displayPrice = item.salePrice ?? item.price;
  const isEnquiry = !Number.isFinite(displayPrice) || displayPrice <= 0;
  const productHref = resolveLinkHref(item.href);
  const badgeLabel = resolveDealBadgeLabel(item);

  return (
    <div className="homepage-deals-card-wrap">
      <ProductShareButton
        overlay
        position="top-right"
        title={`${item.brand} ${item.name}`}
        url={productHref}
      />
      <Link
      href={productHref}
      className="tile--link"
      data-hp-section="sale events"
      data-hp-slot="slider"
      data-id={item.id}
      data-hp-slot-position={slotPosition}
    >
      <div className="tile multi multi--slider radius-lg bg-white homepage-deals-card">
        <span className="homepage-deals-card__ribbon" aria-hidden="true">
          <span className="homepage-deals-card__ribbon-text">{badgeLabel}</span>
        </span>
        <div className="tile--body">
          <div className="tile--image bg-white homepage-deals-card__media">
            <div className="homepage-deals-card__img-frame">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.imageAlt}
                  width={300}
                  height={300}
                  loading="lazy"
                />
              ) : null}
            </div>
          </div>
          <div className="content">
            <p className="product-brand">{item.brand}</p>
            <h3 className="product-name type-sm text-black" title={item.name}>
              {displayName}
            </h3>
            <div
              className={`special-offer type-fixed-14 text-red${item.offerText ? "" : " special-offer--empty"}`}
              aria-hidden={!item.offerText}
            >
              {item.offerText ?? "\u00a0"}
            </div>
            <div className="price-block">
              <span
                className={
                  isEnquiry
                    ? "homepage-price-enquiry"
                    : "type-fixed-20 text-black weight-demi"
                }
              >
                {formatDisplayPrice(item.price, item.salePrice)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
    </div>
  );
}
