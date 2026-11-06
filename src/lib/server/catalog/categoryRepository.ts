import { randomUUID } from "crypto";
import { isPostgresConfigured, prisma } from "@/lib/db/prisma";
import { invalidateCatalogCache } from "@/lib/server/storeCatalogRepository";
import { invalidateAllStorefrontCaches } from "@/lib/server/storefront/storefrontCacheInvalidation";
import { categoryToPrisma } from "@/lib/server/prisma/mappers";
import { slugify } from "@/lib/slug";
import type { AdminCategory } from "@/types/admin";

function mapAdminCategory(row: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  imageUrl: string | null;
  featuredImageUrls: unknown;
  isFeatured: boolean;
  isActive?: boolean;
  isArchived?: boolean;
  sortOrder: number;
  metaTitle: string | null;
  metaDescription: string | null;
  productCount: number;
  createdAt: string | null;
  updatedAt: string | null;
}): AdminCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    parentId: row.parentId,
    imageUrl: row.imageUrl ?? undefined,
    featuredImageUrls: Array.isArray(row.featuredImageUrls)
      ? row.featuredImageUrls.filter((value): value is string => typeof value === "string")
      : undefined,
    isFeatured: row.isFeatured,
    isActive: row.isActive ?? true,
    isArchived: row.isArchived ?? false,
    sortOrder: row.sortOrder,
    metaTitle: row.metaTitle ?? undefined,
    metaDescription: row.metaDescription ?? undefined,
    productCount: row.productCount,
    createdAt: row.createdAt ?? undefined,
    updatedAt: row.updatedAt ?? undefined,
  };
}

async function staticCategories(): Promise<AdminCategory[]> {
  const { loadCategories } = await import("@/lib/server/catalogRepository");
  const { HEADER_MEGA_MENUS } = await import("@/data/headerMegaMenu");
  const mains: AdminCategory[] = loadCategories().map((cat, index) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    parentId: null,
    imageUrl: undefined,
    isFeatured: index < 8,
    sortOrder: index,
    productCount: 0,
  }));

  const subs: AdminCategory[] = [];
  const usedSlugs = new Set(mains.map((m) => m.slug));
  let subOrder = 100;

  for (const menu of HEADER_MEGA_MENUS) {
    const mainCat = mains.find(
      (c) =>
        c.slug === menu.slug ||
        c.id === menu.slug ||
        c.name.toLowerCase() === menu.name.toLowerCase(),
    );
    if (!mainCat) continue;

    for (const column of menu.columns) {
      for (const link of column.links) {
        if (link.label.toLowerCase().startsWith("shop all")) continue;
        const baseSlug = slugify(link.label);
        const subSlug = usedSlugs.has(baseSlug) ? `${mainCat.slug}-${baseSlug}` : baseSlug;
        usedSlugs.add(subSlug);

        subs.push({
          id: `sub_${mainCat.slug}_${subSlug}`,
          name: link.label,
          slug: subSlug,
          description: `${link.label} in ${mainCat.name}`,
          parentId: mainCat.id,
          isFeatured: false,
          sortOrder: subOrder++,
          productCount: 0,
        });
      }
    }
  }

  return [...mains, ...subs];
}

async function seedCategoriesFromStatic(): Promise<AdminCategory[]> {
  const { loadCategories } = await import("@/lib/server/catalogRepository");
  const { getAllProducts } = await import("@/services/catalogService");
  const { HEADER_MEGA_MENUS } = await import("@/data/headerMegaMenu");
  const staticCategories = loadCategories();

  let products: Awaited<ReturnType<typeof getAllProducts>> = [];
  try {
    products = await getAllProducts(true);
  } catch (err) {
    console.warn(
      "[categoryRepository] Failed to load products for seeding, continuing with empty products:",
      err,
    );
  }

  const now = new Date().toISOString();

  const categories: AdminCategory[] = staticCategories.map((cat, index) => {
    const productCount = products.filter(
      (p) => p.categorySlug === cat.slug && p.status === "active" && p.price > 0,
    ).length;
    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      parentId: null,
      isFeatured: index < 8,
      sortOrder: index,
      productCount,
      createdAt: now,
      updatedAt: now,
    };
  });

  const subCategories: AdminCategory[] = [];
  const usedSlugs = new Set(categories.map((c) => c.slug));
  let subOrder = 100;

  for (const menu of HEADER_MEGA_MENUS) {
    const mainCat = categories.find(
      (c) =>
        c.slug === menu.slug ||
        c.id === menu.slug ||
        c.name.toLowerCase() === menu.name.toLowerCase(),
    );
    if (!mainCat) continue;

    for (const column of menu.columns) {
      for (const link of column.links) {
        if (link.label.toLowerCase().startsWith("shop all")) continue;
        const baseSlug = slugify(link.label);
        const subSlug = usedSlugs.has(baseSlug) ? `${mainCat.slug}-${baseSlug}` : baseSlug;
        usedSlugs.add(subSlug);

        const subCount = products.filter(
          (p) =>
            p.status === "active" &&
            p.price > 0 &&
            (p.subcategory?.toLowerCase().includes(link.label.toLowerCase()) ||
              p.categorySlug === mainCat.slug),
        ).length;

        subCategories.push({
          id: `sub_${mainCat.slug}_${subSlug}`,
          name: link.label,
          slug: subSlug,
          description: `${link.label} in ${mainCat.name}`,
          parentId: mainCat.id,
          isFeatured: false,
          sortOrder: subOrder++,
          productCount: subCount,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }

  const allCategories = [...categories, ...subCategories];

  for (const category of allCategories) {
    try {
      await prisma.category.upsert({
        where: { id: category.id },
        create: {
          ...categoryToPrisma(category),
          parentId: category.parentId ?? null,
          metaTitle: null,
          metaDescription: null,
          productCount: category.productCount ?? 0,
          createdAt: now,
          updatedAt: now,
        },
        update: {
          ...categoryToPrisma(category),
          parentId: category.parentId ?? null,
          productCount: category.productCount ?? 0,
          updatedAt: now,
        },
      });
    } catch (upsertErr) {
      console.warn(`[categoryRepository] Failed to upsert category ${category.id}:`, upsertErr);
    }
  }

  return allCategories;
}

export async function listCategories(): Promise<AdminCategory[]> {
  if (!isPostgresConfigured()) {
    console.debug("[categoryRepository] PostgreSQL not configured, using static categories");
    return staticCategories();
  }

  try {
    const [rows, productCategories, activeProducts] = await Promise.all([
      prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.productCategory.findMany({ select: { productId: true, categoryId: true } }),
      prisma.product.findMany({
        where: { status: "active" },
        select: { id: true, categorySlug: true, subcategory: true },
      }),
    ]);

    // Return categories from database - never automatically re-seed on empty,
    // so deletions remain permanent and do not revert back.
    if (rows.length === 0) {
      console.debug("[categoryRepository] Returning 0 categories from database (explicitly empty)");
      return [];
    }

    // Compute live product counts dynamically
    const countSets = new Map<string, Set<string>>();
    for (const cat of rows) {
      countSets.set(cat.id, new Set<string>());
    }

    // 1. Join table mappings
    for (const pc of productCategories) {
      countSets.get(pc.categoryId)?.add(pc.productId);
    }

    // 2. Direct product attributes (categorySlug and subcategory)
    for (const p of activeProducts) {
      const pCatSlug = p.categorySlug ? slugify(p.categorySlug) : "";
      const pSubSlug = p.subcategory ? slugify(p.subcategory) : "";
      const pSubLower = p.subcategory ? p.subcategory.trim().toLowerCase() : "";

      for (const cat of rows) {
        const catSlug = slugify(cat.slug);
        const catNameLower = cat.name.trim().toLowerCase();

        if (cat.parentId) {
          // Subcategory
          if (
            (pSubSlug &&
              (catSlug === pSubSlug ||
                catSlug.endsWith(`-${pSubSlug}`) ||
                pSubSlug.endsWith(`-${catSlug}`))) ||
            (pSubLower &&
              (catNameLower === pSubLower ||
                pSubLower.includes(catNameLower) ||
                catNameLower.includes(pSubLower)))
          ) {
            countSets.get(cat.id)?.add(p.id);
          }
        } else {
          // Main category
          if (
            pCatSlug &&
            (catSlug === pCatSlug ||
              catSlug.includes(pCatSlug) ||
              pCatSlug.includes(catSlug) ||
              cat.id === `cat_${pCatSlug}` ||
              cat.id === `cat-${pCatSlug}`)
          ) {
            countSets.get(cat.id)?.add(p.id);
          }
        }
      }
    }

    // 3. Roll up subcategory counts to parent category
    for (const cat of rows) {
      if (cat.parentId) {
        const parentSet = countSets.get(cat.parentId);
        const childSet = countSets.get(cat.id);
        if (parentSet && childSet) {
          for (const pid of childSet) {
            parentSet.add(pid);
          }
        }
      }
    }

    // Synchronize count updates to database in background
    void (async () => {
      try {
        for (const cat of rows) {
          const liveCount = countSets.get(cat.id)?.size ?? 0;
          if (liveCount !== cat.productCount) {
            await prisma.category.update({
              where: { id: cat.id },
              data: { productCount: liveCount },
            });
          }
        }
      } catch {
        /* background sync handles concurrency silently */
      }
    })();

    console.debug(
      "[categoryRepository] Returning",
      rows.length,
      "categories with dynamic product counts",
    );
    return rows.map((row) => {
      const liveCount = countSets.get(row.id)?.size ?? row.productCount;
      return mapAdminCategory({ ...row, productCount: liveCount });
    });
  } catch (err) {
    console.error(
      "[categoryRepository] Failed to list categories from database, falling back to in-memory static categories:",
      err instanceof Error ? err.message : String(err),
    );
    // Ultimate fallback: return in-memory static categories only on DB failure
    try {
      const fallback = await staticCategories();
      console.debug(
        "[categoryRepository] Fallback successful, returning",
        fallback.length,
        "static categories",
      );
      return fallback;
    } catch (fallbackErr) {
      console.error("[categoryRepository] Even fallback failed:", fallbackErr);
      throw fallbackErr;
    }
  }
}

export { seedCategoriesFromStatic };

export async function getCategoryById(id: string): Promise<AdminCategory | null> {
  const row = await prisma.category.findUnique({ where: { id } });
  return row ? mapAdminCategory(row) : null;
}

export async function createCategory(
  input: Omit<AdminCategory, "id" | "createdAt" | "updatedAt">,
): Promise<AdminCategory> {
  const now = new Date().toISOString();
  const slug = input.slug || slugify(input.name);
  const record: AdminCategory = {
    ...input,
    id: randomUUID(),
    slug,
    createdAt: now,
    updatedAt: now,
  };

  await prisma.category.create({
    data: {
      ...categoryToPrisma(record),
      parentId: record.parentId ?? null,
      metaTitle: record.metaTitle ?? null,
      metaDescription: record.metaDescription ?? null,
      productCount: record.productCount ?? 0,
      isActive: record.isActive ?? true,
      isArchived: record.isArchived ?? false,
      createdAt: now,
      updatedAt: now,
    },
  });

  invalidateCatalogCache();
  try {
    invalidateAllStorefrontCaches();
  } catch {
    /* outside request scope */
  }
  return record;
}

export async function updateCategory(
  id: string,
  patch: Partial<AdminCategory>,
): Promise<AdminCategory> {
  const now = new Date().toISOString();
  const rest = { ...patch };
  delete rest.id;
  delete rest.createdAt;

  await prisma.category.update({
    where: { id },
    data: {
      ...(rest.name !== undefined ? { name: rest.name } : {}),
      ...(rest.slug !== undefined ? { slug: rest.slug } : {}),
      ...(rest.description !== undefined ? { description: rest.description ?? null } : {}),
      ...(rest.parentId !== undefined ? { parentId: rest.parentId } : {}),
      ...(rest.imageUrl !== undefined ? { imageUrl: rest.imageUrl ?? null } : {}),
      ...(rest.featuredImageUrls !== undefined
        ? { featuredImageUrls: rest.featuredImageUrls }
        : {}),
      ...(rest.isFeatured !== undefined ? { isFeatured: rest.isFeatured } : {}),
      ...(rest.isActive !== undefined ? { isActive: rest.isActive } : {}),
      ...(rest.isArchived !== undefined ? { isArchived: rest.isArchived } : {}),
      ...(rest.sortOrder !== undefined ? { sortOrder: rest.sortOrder } : {}),
      ...(rest.metaTitle !== undefined ? { metaTitle: rest.metaTitle ?? null } : {}),
      ...(rest.metaDescription !== undefined
        ? { metaDescription: rest.metaDescription ?? null }
        : {}),
      ...(rest.productCount !== undefined ? { productCount: rest.productCount } : {}),
      updatedAt: now,
    },
  });

  invalidateCatalogCache();
  try {
    invalidateAllStorefrontCaches();
  } catch {
    /* outside request scope */
  }
  const updated = await getCategoryById(id);
  if (!updated) throw new Error("Category not found after update");
  return updated;
}

export async function archiveCategory(id: string, isArchived = true): Promise<AdminCategory> {
  return updateCategory(id, { isArchived, isActive: !isArchived });
}

export async function deleteCategory(id: string): Promise<void> {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) return;

  // Safeguard: Check if this category or any child category has products assigned
  const subcategories = await prisma.category.findMany({
    where: { parentId: id },
    select: { id: true, slug: true, name: true },
  });
  const allSlugs = [category.slug, ...subcategories.map((s) => s.slug)];
  const allNames = [category.name, ...subcategories.map((s) => s.name)];

  const assignedProductsCount = await prisma.product.count({
    where: {
      OR: [{ categorySlug: { in: allSlugs } }, { category: { in: allNames } }],
    },
  });

  if (assignedProductsCount > 0) {
    throw new Error(
      `Cannot delete category "${category.name}" because ${assignedProductsCount} product(s) are assigned to it or its subcategories. Please reassign products to another category or archive this category instead.`,
    );
  }

  // Safe to delete child subcategories if neither parent nor children have assigned products
  if (subcategories.length > 0) {
    await prisma.category.deleteMany({ where: { parentId: id } });
  }

  // CRITICAL REQUIREMENT:
  // Under NO circumstances delete homepage items, header navigation items, or taxonomy nodes!
  // Removing a category leaves any existing header link or homepage item untouched (they remain independent records).

  await prisma.category.delete({ where: { id } });
  invalidateCatalogCache();
  try {
    invalidateAllStorefrontCaches();
  } catch {
    /* outside request scope */
  }
}
