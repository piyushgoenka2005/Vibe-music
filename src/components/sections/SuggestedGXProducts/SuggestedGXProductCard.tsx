import Link from "next/link";
import { resolveLinkHref } from "@/lib/routes";
import { usdToInr } from "@/utils/currency";
import type { SuggestedGXProductItem } from "@/data/suggestedGXProducts";

interface SuggestedGXProductCardProps {
  item: SuggestedGXProductItem;
}

function formatInr(usd: number): string {
  return usdToInr(usd).toLocaleString("en-IN");
}

/** One Gear Exchange listing card in the homepage GX carousel. */
export default function SuggestedGXProductCard({
  item,
}: SuggestedGXProductCardProps) {
  return (
    <div className="product-suggest__item-wrap">
      <Link
        href={resolveLinkHref(item.href)}
        className="product-suggest__item"
        data-hp-section="gx-product-suggest"
        data-hp-slot={item.slotPosition}
        data-id={item.id}
      >
        <div className="product-suggest__item-listed-at">
          Listed at ₹{formatInr(item.listedPriceUsd)}
        </div>
        <div className="product-suggest__item-img">
          <img src={item.imageSrc} alt={item.imageAlt} loading="lazy" />
        </div>
        <div className="product-suggest__item-content">
          <div>
            <strong>{item.brand}</strong> {item.title}
          </div>
          <div className="product-suggest__price">
            <sup>₹</sup>
            <span className="product-suggest__dollars">
              {formatInr(item.priceUsd)}
            </span>
          </div>
          <div className="product-suggest__shipping">{item.shippingLabel}</div>
        </div>
        <div className="product-suggest__item-cust-since">
          <span>Customer since {item.customerSinceYear}</span>
        </div>
      </Link>
    </div>
  );
}
