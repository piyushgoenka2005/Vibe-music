import categoriesData from "@/data/catalog/categories.json";
import { findCategoryInList } from "@/lib/categorySlug";
import type { Category } from "@/types/category";

/** Category metadata from categories.json (no product duplication). */
export const CATEGORIES: Category[] = categoriesData as Category[];

export function getCategoryBySlug(slug: string): Category | undefined {
  return findCategoryInList(CATEGORIES, slug);
}
