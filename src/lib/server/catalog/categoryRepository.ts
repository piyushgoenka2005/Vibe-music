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
  isFeatured: boolean;
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
    isFeatured: row.isFeatured,
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
    const rows = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });

    // If database is empty (e.g., after deletion), seed from static data
    if (rows.length === 0) {
      console.debug(
        "[categoryRepository] No categories in database, attempting to seed from static data...",
      );
      try {
        const seededCategories = await seedCategoriesFromStatic();
        console.debug(
          "[categoryRepository] Successfully seeded",
          seededCategories.length,
          "categories from static data",
        );
        return seededCategories;
      } catch (seedErr) {
        console.error(
          "[categoryRepository] Failed to seed categories from static data, falling back to in-memory static categories:",
          seedErr instanceof Error ? seedErr.message : String(seedErr),
        );
        // If seeding fails, fall back to static categories without DB persistence
        return staticCategories();
      }
    }

    // Return categories from database
    console.debug("[categoryRepository] Returning", rows.length, "categories from database");
    return rows.map(mapAdminCategory);
  } catch (err) {
    console.error(
      "[categoryRepository] Failed to list categories from database, falling back to in-memory static categories:",
      err instanceof Error ? err.message : String(err),
    );
    // Ultimate fallback: return in-memory static categories
    return staticCategories();
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
      ...(rest.isFeatured !== undefined ? { isFeatured: rest.isFeatured } : {}),
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

export async function deleteCategory(id: string): Promise<void> {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) return;

  // Clean up any subcategories belonging to this parent so deletion never fails with foreign/orphan errors
  await prisma.category.deleteMany({ where: { parentId: id } });

  // Clean up any homepage section item pointing to this category slug
  await prisma.homepageSectionItem.deleteMany({
    where: { categorySlug: category.slug },
  });

  await prisma.category.delete({ where: { id } });
  invalidateCatalogCache();
  try {
    invalidateAllStorefrontCaches();
  } catch {
    /* outside request scope */
  }
}
