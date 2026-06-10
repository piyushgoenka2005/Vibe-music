import Link from "next/link";
import { resolveLinkHref } from "@/lib/routes";
import {
  POPULAR_CATEGORY_IMAGE_SIZES,
  type PopularCategoryItem,
} from "@/data/popularCategories";

interface CategoryCardProps {
  item: PopularCategoryItem;
}

export default function CategoryCard({ item }: CategoryCardProps) {
  return (
    <Link
      href={resolveLinkHref(item.href)}
      className="popcat-item"
      data-hp-section="categories"
      data-hp-slot={item.slot}
    >
      {item.badge ? (
        <div className="popcat-badge tile-label bg-red text-white text-xxs">
          {item.badge}
        </div>
      ) : null}
      <picture className="popcat-image">
        <source
          type="image/webp"
          srcSet={item.imageSrcSet}
          sizes={POPULAR_CATEGORY_IMAGE_SIZES}
        />
        <img width={101} height={101} src={item.imageSrc} alt="" />
      </picture>
      <div className="popcat-name">
        <h3>{item.title}</h3>
      </div>
    </Link>
  );
}
