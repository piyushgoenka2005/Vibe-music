import Link from "next/link";
import { LegacySupPrice } from "@/lib/legacySupPrice";
import { resolveLinkHref } from "@/lib/routes";
import type { TopNewProductItem } from "@/data/topNewProducts";

interface TopNewProductCardProps {
  item: TopNewProductItem;
}

export default function TopNewProductCard({ item }: TopNewProductCardProps) {
  return (
    <Link
      href={resolveLinkHref(item.href)}
      className="topnew-item"
      data-key={item.id}
      data-hp-section="top-new"
      data-hp-slot={item.hpSlot}
    >
      <div className="topnew-rank">{item.rank}</div>
      <div className="topnew-image">
        <img
          width={item.image.width}
          height={item.image.height}
          src={item.image.src}
          srcSet={item.image.srcSet}
          sizes={item.image.sizes}
          alt={item.image.alt}
          loading="lazy"
        />
      </div>

      {item.preorder ? (
        <div className="top-new__item-preorder">{item.preorderLabel}</div>
      ) : null}

      <span className="top-new__item-name">
        <strong>{item.brand}</strong> {item.title}
      </span>

      <div className="top-new__item-price">
        <LegacySupPrice usd={item.priceUsd} />
      </div>
    </Link>
  );
}
