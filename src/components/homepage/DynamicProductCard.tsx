import Link from "next/link";
import { formatCurrency } from "@/utils/currency";
import { resolveLinkHref } from "@/lib/routes";
import type { HomepageProductItem } from "@/types/homepage";

interface DynamicProductCardProps {
  item: HomepageProductItem;
  sectionKey: string;
  showRank?: boolean;
}

export default function DynamicProductCard({
  item,
  sectionKey,
  showRank = false,
}: DynamicProductCardProps) {
  const displayPrice = item.salePrice ?? item.price;

  return (
    <Link
      href={resolveLinkHref(item.href)}
      className="topnew-item"
      data-key={item.id}
      data-hp-section={sectionKey}
    >
      {showRank && item.rank ? <div className="topnew-rank">{item.rank}</div> : null}
      <div className="topnew-image">
        {item.image ? (
          <img
            width={300}
            height={300}
            src={item.image}
            alt={item.imageAlt}
            loading="lazy"
          />
        ) : null}
      </div>

      <span className="top-new__item-name">
        <strong>{item.brand}</strong> {item.name}
      </span>

      <div className="top-new__item-price">{formatCurrency(displayPrice)}</div>
    </Link>
  );
}
