import { randomUUID } from "crypto";
import { isPostgresConfigured, prisma } from "@/lib/db/prisma";
import { invalidateCatalogCache } from "@/lib/server/storeCatalogRepository";
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
  return loadCategories().map((cat, index) => ({
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
}

async function seedCategoriesFromStatic(): Promise<AdminCategory[]> {
  const { loadCategories } = await import("@/lib/server/catalogRepository");
  const { getAllProducts } = await import("@/services/catalogService");
  const staticCategories = loadCategories();
  const products = await getAllProducts(true);
  const now = new Date().toISOString();

  const categories: AdminCategory[] = staticCategories.map((cat, index) => {
    const productCount = products.filter(
      (p) =>
        p.categorySlug === cat.slug &&
        p.status === "active" &&
        p.price > 0
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

  await prisma.$transaction(
    categories.map((category) =>
      prisma.category.upsert({
        where: { id: category.id },
        create: {
          ...categoryToPrisma(category),
          parentId: null,
          metaTitle: null,
          metaDescription: null,
          productCount: category.productCount ?? 0,
          createdAt: now,
          updatedAt: now,
        },
        update: {
          ...categoryToPrisma(category),
          productCount: category.productCount ?? 0,
          updatedAt: now,
        },
      })
    )
  );

  return categories;
}

export async function listCategories(): Promise<AdminCategory[]> {
  if (!isPostgresConfigured()) {
    return staticCategories();
  }

  try {
    const rows = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
    if (rows.length === 0) {
      return seedCategoriesFromStatic();
    }
    return rows.map(mapAdminCategory);
  } catch {
    return staticCategories();
  }
}

export async function getCategoryById(id: string): Promise<AdminCategory | null> {
  const row = await prisma.category.findUnique({ where: { id } });
  return row ? mapAdminCategory(row) : null;
}

export async function createCategory(
  input: Omit<AdminCategory, "id" | "createdAt" | "updatedAt">
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
  return record;
}

export async function updateCategory(
  id: string,
  patch: Partial<AdminCategory>
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
  const updated = await getCategoryById(id);
  if (!updated) throw new Error("Category not found after update");
  return updated;
}

export async function deleteCategory(id: string): Promise<void> {
  const children = await prisma.category.count({ where: { parentId: id } });
  if (children > 0) {
    throw new Error("Cannot delete category with subcategories");
  }
  await prisma.category.delete({ where: { id } });
  invalidateCatalogCache();
}
