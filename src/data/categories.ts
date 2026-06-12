import categoriesData from "@/data/catalog/categories.json";
import type { Category } from "@/types/category";

/** Category metadata from categories.json (no product duplication). */
export const CATEGORIES: Category[] = categoriesData as Category[];

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
