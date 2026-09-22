import { getCategoryBentoPublicData } from "@/lib/server/homepageService";
import CategoryBentoShowcase from "@/components/home/CategoryBentoShowcase";
import {
  CATEGORY_BENTO_ITEMS,
  resolveBentoImage,
  type CategoryBentoItem,
} from "@/data/categoryBento";
import { resolveLinkHref } from "@/lib/routes";

export default async function CategoryBento() {
  const data = await getCategoryBentoPublicData();
  if (!data.isActive || data.items.length === 0) return null;

  const staticBySlug = new Map(CATEGORY_BENTO_ITEMS.map((item) => [item.slug, item]));

  const items: CategoryBentoItem[] = data.items.map((item) => {
    const fallback = staticBySlug.get(item.slug);
    return {
      slug: item.slug,
      title: item.title,
      desc: item.desc || fallback?.desc || "",
      size: fallback?.size ?? "small",
      variant: fallback?.variant ?? "image-card",
      image: item.imageSrc?.split("?")[0] || fallback?.image || resolveBentoImage(item.slug),
      imageSrcSet: fallback?.imageSrcSet,
      imageSizes: fallback?.imageSizes,
      imageAlt: fallback?.imageAlt || item.title,
      imagePosition: fallback?.imagePosition ?? "center center",
      wide: fallback?.wide,
      productCount: fallback?.productCount,
      brands: item.brands || fallback?.brands,
      badge: (item.badge as CategoryBentoItem["badge"]) || fallback?.badge,
      href: resolveLinkHref(item.href),
    };
  });

  return (
    <CategoryBentoShowcase
      items={items}
      title={data.title}
      ctaText={data.ctaText}
      ctaLink={resolveLinkHref(data.ctaLink)}
      exploreLabel={data.accentLabel || "Explore Category"}
    />
  );
}
