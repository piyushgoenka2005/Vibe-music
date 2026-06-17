import { LegacySupPrice } from "@/lib/legacySupPrice";
import NewArrivalsProductCard from "@/components/homepage/NewArrivalsProductCard";
import type { TopNewProductItem } from "@/data/topNewProducts";

interface TopNewProductCardProps {
  item: TopNewProductItem;
  featured?: boolean;
}

export default function TopNewProductCard({
  item,
  featured = false,
}: TopNewProductCardProps) {
  return (
    <NewArrivalsProductCard
      brand={item.brand}
      featured={featured}
      hpSlot={item.hpSlot}
      href={item.href}
      id={item.id}
      image={item.image.src}
      imageAlt={item.image.alt}
      name={item.title}
      preorderLabel={item.preorder ? item.preorderLabel : undefined}
      price={item.priceUsd}
      priceNode={<LegacySupPrice usd={item.priceUsd} />}
      rank={item.rank}
      sectionKey="top-new"
    />
  );
}
