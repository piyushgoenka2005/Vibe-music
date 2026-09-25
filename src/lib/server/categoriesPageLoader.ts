import "server-only";

import { cache } from "react";
import { getCategoryGridImage, hasCuratedCategoryImage } from "@/lib/categoryImages";
import { isAmplifierProduct } from "@/lib/catalog/categoryProductsCore";
import { ROUTES } from "@/lib/routes";
import { getCategoryCatalog } from "@/lib/server/categoryResolver";
import { getAllProducts } from "@/services/catalogService";
import type { Category } from "@/types/category";

export interface CategoryIndexItem extends Category {
  productCount: number;
  imageSrc?: string;
  /** Override link for virtual browse tiles (e.g. Amplifiers). */
  href?: string;
}

/** Departments shown on /category even when the live count is still zero. */
const FEATURED_INDEX_SLUGS = ["band-orchestra", "software-plug-ins"] as const;

const FEATURED_INDEX_DEPARTMENTS: CategoryIndexItem[] = [
  {
    id: "cat-10",
    name: "Band & Orchestra",
    slug: "band-orchestra",
    description: "Shop band & orchestra from top brands with expert support and fast shipping.",
    productCount: 0,
    sortOrder: 10,
  },
  {
    id: "cat-7",
    name: "Software & Plug-ins",
    slug: "software-plug-ins",
    description: "Shop software & plug-ins from top brands with expert support and fast shipping.",
    productCount: 0,
    sortOrder: 7,
  },
];

export const loadCategoriesForIndex = cache(async function loadCategoriesForIndex(): Promise<
  CategoryIndexItem[]
> {
  const [categories, products] = await Promise.all([getCategoryCatalog(), getAllProducts(false)]);

  const countBySlug = new Map<string, number>();
  for (const product of products) {
    if (product.status !== "active") continue;
    const slug = product.categorySlug?.trim();
    if (!slug) continue;
    countBySlug.set(slug, (countBySlug.get(slug) ?? 0) + 1);
  }

  const items: CategoryIndexItem[] = categories
    .map((category) => {
      const productCount = countBySlug.get(category.slug) ?? category.productCount ?? 0;
      // Always prefer curated local art over CMS imageUrl — admin/CMS often
      // reused the Guitars Les Paul thumb for Bass, Software, etc.
      const imageSrc = hasCuratedCategoryImage(category.slug)
        ? getCategoryGridImage(category.slug)
        : category.imageUrl || getCategoryGridImage(category.slug);
      return {
        ...category,
        productCount,
        imageSrc,
      };
    })
    .filter(
      (category) =>
        category.productCount > 0 ||
        FEATURED_INDEX_SLUGS.includes(category.slug as (typeof FEATURED_INDEX_SLUGS)[number]),
    );

  const amplifierCount = products.filter(
    (product) => product.status === "active" && isAmplifierProduct(product),
  ).length;

  if (amplifierCount > 0) {
    const amplifierItem: CategoryIndexItem = {
      id: "virtual-amplifier",
      name: "Amplifiers",
      slug: "amplifier",
      description: "Guitar and instrument amplifiers for practice, studio, and stage.",
      productCount: amplifierCount,
      imageSrc: "/images/browse-categories/amplifiers.jpg",
      href: `${ROUTES.searchResults}?cat=amplifier`,
      sortOrder: 2,
    };

    const guitarIndex = items.findIndex((item) => item.slug === "guitars");
    if (guitarIndex >= 0) {
      items.splice(guitarIndex + 1, 0, amplifierItem);
    } else {
      items.push(amplifierItem);
    }
  }

  for (const featured of FEATURED_INDEX_DEPARTMENTS) {
    if (items.some((item) => item.slug === featured.slug)) continue;
    items.push({
      ...featured,
      productCount: countBySlug.get(featured.slug) ?? 0,
      imageSrc: getCategoryGridImage(featured.slug),
    });
  }

  return items.sort((a, b) => {
    const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });
});
