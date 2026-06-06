import { POPULAR_CATEGORIES } from "@/lib/constants";
import { slugify } from "@/lib/slug";
import { PRODUCTS } from "@/data/products";
import type { Category } from "@/types/category";

export const CATEGORIES: Category[] = POPULAR_CATEGORIES.map((name, index) => {
  const slug = slugify(name);
  const productCount = PRODUCTS.filter((p) => p.categorySlug === slug).length;
  return {
    id: `cat-${index + 1}`,
    name,
    slug,
    description: `Shop ${name.toLowerCase()} from top brands with expert support and fast shipping.`,
    productCount,
  };
});

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
