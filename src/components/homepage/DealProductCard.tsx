import Link from "next/link";
import { formatDisplayPrice } from "@/utils/currency";
import { resolveLinkHref } from "@/lib/routes";
import type { HomepageProductItem } from "@/types/homepage";

interface DealProductCardProps {
  item: HomepageProductItem;
  slotPosition: number;
}

export default function DealProductCard({ item, slotPosition }: DealProductCardProps) {
  return (
    <Link
      href={resolveLinkHref(item.href)}
      className="tile--link"
      data-hp-section="sale events"
      data-hp-slot="slider"
      data-id={item.id}
      data-hp-slot-position={slotPosition}
    >
      <div className="tile multi multi--slider radius-lg bg-white">
        <div className="tile--body">
          <div className="tile--image bg-white">
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
          <div className="content">
            <div className="product-name type-sm weight-demi text-black">
              <span className="weight-demi text-gray600">{item.brand}</span>{" "}
              {item.name}
            </div>
            {item.offerText ? (
              <div className="special-offer type-fixed-14 text-red">{item.offerText}</div>
            ) : null}
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
