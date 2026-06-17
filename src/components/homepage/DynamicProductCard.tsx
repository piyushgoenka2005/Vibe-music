import NewArrivalsProductCard from "@/components/homepage/NewArrivalsProductCard";
import type { HomepageProductItem } from "@/types/homepage";

interface DynamicProductCardProps {
  item: HomepageProductItem;
  sectionKey: string;
  showRank?: boolean;
  featured?: boolean;
}

export default function DynamicProductCard({
  item,
  sectionKey,
  showRank = false,
  featured = false,
}: DynamicProductCardProps) {
  return (
    <NewArrivalsProductCard
      badgeLabel={item.badgeLabel}
      brand={item.brand}
      featured={featured}
      href={item.href}
      id={item.id}
      image={item.image}
      imageAlt={item.imageAlt}
      name={item.name}
      price={item.price}
      rank={showRank ? item.rank : undefined}
      rating={item.rating}
      reviewCount={item.reviewCount}
      salePrice={item.salePrice}
      sectionKey={sectionKey}
    />
  );
}
