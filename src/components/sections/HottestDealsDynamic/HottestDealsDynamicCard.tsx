import Link from "next/link";
import { LegacySupPrice } from "@/lib/legacySupPrice";
import { resolveLinkHref } from "@/lib/routes";
import type { HottestDealsDynamicItem } from "@/data/hottestDealsDynamic";

interface HottestDealsDynamicCardProps {
  item: HottestDealsDynamicItem;
}

/** One deal card in the homepage `#hottest-deals` carousel. */
export default function HottestDealsDynamicCard({
  item,
}: HottestDealsDynamicCardProps) {
  return (
    <div className="product-suggest__item-wrap">
      <Link
        href={resolveLinkHref(item.href)}
        className="product-suggest__item"
        data-hp-section="hottest-deals"
        data-hp-slot={item.slotPosition}
        data-id={item.id}
      >
        <div className="product-suggest__item-img">
          <img src={item.imageSrc} alt={item.imageAlt} loading="lazy" />
          <div className="product-suggest__item-price badge">
            {item.badgeLabel}
          </div>
        </div>
        <div className="product-suggest__item-content">
          <div className="product-suggest__name">
            <strong>{item.brand}</strong> {item.title}
          </div>
          <div className="product-suggest__item-price">
            <LegacySupPrice usd={item.priceUsd} />
          </div>
          <div className="product-suggest__item-was-price">
            Was <LegacySupPrice usd={item.wasPriceUsd} />
          </div>
        </div>
      </Link>
    </div>
  );
}
