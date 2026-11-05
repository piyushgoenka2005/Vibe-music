/**
 * Fixed category filtering using ProductCategory FK relationships.
 *
 * This module replaces the broken text-based category matching with proper
 * database foreign key lookups via the ProductCategory join table.
 *
 * Usage:
 * ```typescript
 * const categoryIds = await resolveCategoryIdsForFilter(slug);
 * const products = await fetchProductsByCategories(categoryIds);
 * ```
 */

import type { CatalogProduct, ProductSearchOptions } from "@/types/product";
import { normalizeCategorySlug } from "./catalogService";
import { fetchCategories, findCategoryInList } from "./categoryResolver";
import { prisma } from "@/lib/db/prisma";
import { toProduct } from "./mappers";

/**
 * Resolve a category slug to a set of category IDs to include in search results.
 *
 * For parent categories, includes all child categories so browsing parents
 * shows products from child categories.
 *
 * For leaf categories, returns just that category's ID.
 *
 * @param slug - Category slug to resolve
 * @returns Array of category IDs to include in search
 */
export async function resolveCategoryIdsForFilter(slug: string): Promise<string[]> {
  const normalized = normalizeCategorySlug(slug);
  if (!normalized) return [];

  // Fetch all categories to build tree
  const categories = await fetchCategories();
  const targetCategory = findCategoryInList(categories, normalized);

  if (!targetCategory) {
    return [];
  }

  // Build set of category IDs to include: target + all descendants
  const categoryIds = new Set<string>([targetCategory.id]);
  const queue = [targetCategory.id];

  while (queue.length > 0) {
    const parentId = queue.shift()!;
    for (const category of categories) {
      if (category.parentId === parentId && !categoryIds.has(category.id)) {
        categoryIds.add(category.id);
        queue.push(category.id);
      }
    }
  }

  return Array.from(categoryIds);
}

/**
 * Fetch all active products assigned to one or more categories via ProductCategory FK.
 *
 * This is the FK-based alternative to text field matching.
 *
 * @param categoryIds - Array of category IDs to filter by
 * @param includeInactive - Whether to include inactive products (default: false)
 * @returns Matching active products
 */
export async function fetchProductsByCategories(
  categoryIds: string[],
  includeInactive: boolean = false,
): Promise<CatalogProduct[]> {
  if (categoryIds.length === 0) {
    return [];
  }

  const statuses = includeInactive ? ["active", "draft", "archived"] : ["active"];

  // Step 1: Find all products assigned to these categories
  const productCategoryAssignments = await prisma.productCategory.findMany({
    where: {
      categoryId: { in: categoryIds },
    },
    select: { productId: true },
    distinct: ["productId"],
  });

  const productIds = productCategoryAssignments.map((a) => a.productId);

  if (productIds.length === 0) {
    return [];
  }

  // Step 2: Load product details
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      status: { in: statuses },
    },
  });

  // Step 3: Convert to internal format
  return products.map(toProduct);
}

/**
 * Apply category filter to product list using FK-based matching.
 *
 * Replaces the broken text-based filtering in searchInCatalogProducts.
 *
 * @param source - Initial product list
 * @param categorySlug - Category slug to filter by
 * @returns Filtered product list
 */
export async function filterProductsByCategory(
  source: CatalogProduct[],
  categorySlug: string,
): Promise<CatalogProduct[]> {
  const categoryIds = await resolveCategoryIdsForFilter(categorySlug);

  if (categoryIds.length === 0) {
    // No matching category found
    return [];
  }

  // Convert to set for O(1) lookup
  const categoryIdSet = new Set(categoryIds);

  // For products that have category assignments, filter via FK
  // For products without FK assignments (legacy), fall back to text matching
  const result: CatalogProduct[] = [];
  const productsNeedingFKCheck = source.filter((p) => p.id); // All products

  // Get all ProductCategory assignments for these products in a single query
  const assignments = await prisma.productCategory.findMany({
    where: {
      productId: {
        in: productsNeedingFKCheck.map((p) => p.id),
      },
    },
    select: { productId: true, categoryId: true },
  });

  const assignmentMap = new Map<string, Set<string>>();
  for (const assignment of assignments) {
    if (!assignmentMap.has(assignment.productId)) {
      assignmentMap.set(assignment.productId, new Set());
    }
    assignmentMap.get(assignment.productId)!.add(assignment.categoryId);
  }

  // Filter products
  for (const product of source) {
    const assignedCategoryIds = assignmentMap.get(product.id);

    if (assignedCategoryIds) {
      // Product has FK assignments - use them
      if (
        assignedCategoryIds.size > 0 &&
        Array.from(assignedCategoryIds).some((id) => categoryIdSet.has(id))
      ) {
        result.push(product);
      }
    } else {
      // Fallback for products without FK assignments (legacy migration)
      const normalized = normalizeCategorySlug(product.categorySlug);
      if (normalized && categoryIdSet.has(normalized)) {
        // This is a legacy fallback - should not happen after full migration
        result.push(product);
      }
    }
  }

  return result;
}
