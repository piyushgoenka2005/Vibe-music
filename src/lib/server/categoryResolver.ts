import "server-only";

import { cache } from "react";
import {
  findCategoryInList,
  isCanonicalCategorySlug,
  normalizeCategoryRecord,
} from "@/lib/categorySlug";
import { getCachedCategories } from "@/lib/server/catalogSnapshotCache";
import type { Category } from "@/types/category";

/** Cached category list from Firestore (with local fallback merge). */
export const getCategoryCatalog = cache(async (): Promise<Category[]> => {
  const categories = await getCachedCategories();
  return categories.map(normalizeCategoryRecord);
});

export async function resolveCategoryBySlug(
  requestedSlug: string
): Promise<Category | undefined> {
  const categories = await getCategoryCatalog();
  return findCategoryInList(categories, requestedSlug);
}

export { isCanonicalCategorySlug };
