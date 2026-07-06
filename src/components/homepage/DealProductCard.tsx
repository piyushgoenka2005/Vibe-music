import Link from "next/link";
import { formatProductCardTitle } from "@/lib/product/formatProductCardTitle";
import { formatDisplayPrice } from "@/utils/currency";
import { resolveLinkHref } from "@/lib/routes";
import type { HomepageProductItem } from "@/types/homepage";

interface DealProductCardProps {
  item: HomepageProductItem;
  slotPosition: number;
}

export default function DealProductCard({ item, slotPosition }: DealProductCardProps) {
  const displayName = formatProductCardTitle(item.name, item.brand);

  return (
    <Link
      href={resolveLinkHref(item.href)}
      className="tile--link"
      data-hp-section="sale events"
      data-hp-slot="slider"
      data-id={item.id}
      data-hp-slot-position={slotPosition}
    >
      <div className="tile multi multi--slider radius-lg bg-white homepage-deals-card">
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
              <span className="type-fixed-20 text-black weight-demi">
                {formatDisplayPrice(item.price, item.salePrice)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
