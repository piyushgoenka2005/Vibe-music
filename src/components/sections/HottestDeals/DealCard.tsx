import Link from "next/link";
import {
  formatLegacyUsdInText,
  formatLegacyUsdPrice,
} from "@/lib/legacyPricing";
import { resolveLinkHref } from "@/lib/routes";
import type { HottestDealItem } from "@/data/hottestDeals";

interface DealCardProps {
  item: HottestDealItem;
}

export default function DealCard({ item }: DealCardProps) {
  return (
    <Link
      href={resolveLinkHref(item.href)}
      className="tile--link"
      data-hp-section="sale events"
      data-hp-slot="slider"
      data-id={item.id}
      data-hp-slot-position={item.slotPosition}
    >
      <div className="tile multi  multi--slider radius-lg bg-white">
        <div className="tile--body">
          <div className="tile--image bg-white">
            <img
              src={item.imageSrc}
              alt={item.imageAlt}
              width={300}
              height={300}
              loading="lazy"
            />
          </div>
          <div className="content">
            <div className="product-name type-sm weight-demi text-black">
              <span className="weight-demi text-gray600">{item.brand}</span>{" "}
              {item.title}
            </div>
            <div className="special-offer type-fixed-14 text-red">
              {formatLegacyUsdInText(item.offer)}
            </div>
            <div className="price-block">
              <span className="type-fixed-20 text-black weight-demi">
                {formatLegacyUsdPrice(item.priceUsd)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
