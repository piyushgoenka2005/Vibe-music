import { getAdminFirestore } from "@/lib/firebase/admin";
import { invalidateCatalogCache } from "@/lib/server/firestoreCatalogRepository";
import { slugify } from "@/lib/slug";
import type { AdminCategory } from "@/types/admin";

const COLLECTION = "categories";

function normalizeCategory(id: string, data: FirebaseFirestore.DocumentData): AdminCategory {
  return {
    id,
    name: String(data.name ?? ""),
    slug: String(data.slug ?? slugify(String(data.name ?? ""))),
    description: data.description ? String(data.description) : undefined,
    parentId: data.parentId ?? null,
    imageUrl: data.imageUrl ? String(data.imageUrl) : undefined,
    isFeatured: Boolean(data.isFeatured),
    sortOrder: Number(data.sortOrder ?? 0),
    metaTitle: data.metaTitle ? String(data.metaTitle) : undefined,
    metaDescription: data.metaDescription ? String(data.metaDescription) : undefined,
    productCount: Number(data.productCount ?? 0),
    createdAt: data.createdAt ? String(data.createdAt) : undefined,
    updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
  };
}

export async function listCategories(): Promise<AdminCategory[]> {
  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTION).orderBy("sortOrder", "asc").get();
  if (snap.empty) {
    return seedCategoriesFromStatic();
  }
  return snap.docs.map((doc) => normalizeCategory(doc.id, doc.data()));
}

async function seedCategoriesFromStatic(): Promise<AdminCategory[]> {
  const { loadCategories } = await import("@/lib/server/catalogRepository");
  const { getAllProducts } = await import("@/services/catalogService");
  const staticCategories = loadCategories();
  const products = await getAllProducts(true);
  const db = getAdminFirestore();
  const now = new Date().toISOString();
  const batch = db.batch();

  const categories: AdminCategory[] = staticCategories.map((cat, index) => {
    const productCount = products.filter(
      (p) => p.categorySlug === cat.slug && p.status === "active"
    ).length;
    const record: AdminCategory = {
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
    batch.set(db.collection(COLLECTION).doc(cat.id), record);
    return record;
  });

  await batch.commit();
  return categories;
}

export async function getCategoryById(id: string): Promise<AdminCategory | null> {
  const db = getAdminFirestore();
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return normalizeCategory(doc.id, doc.data()!);
}

export async function createCategory(
  input: Omit<AdminCategory, "id" | "createdAt" | "updatedAt">
): Promise<AdminCategory> {
  const db = getAdminFirestore();
  const ref = db.collection(COLLECTION).doc();
  const now = new Date().toISOString();
  const slug = input.slug || slugify(input.name);
  const record: AdminCategory = {
    ...input,
    id: ref.id,
    slug,
    createdAt: now,
    updatedAt: now,
  };
  await ref.set(record);
  invalidateCatalogCache();
  return record;
}

export async function updateCategory(
  id: string,
  patch: Partial<AdminCategory>
): Promise<AdminCategory> {
  const db = getAdminFirestore();
  const now = new Date().toISOString();
  const rest = { ...patch };
  delete rest.id;
  delete rest.createdAt;
  await db.collection(COLLECTION).doc(id).update({ ...rest, updatedAt: now });
  invalidateCatalogCache();
  const updated = await getCategoryById(id);
  if (!updated) throw new Error("Category not found after update");
  return updated;
}

export async function deleteCategory(id: string): Promise<void> {
  const db = getAdminFirestore();
  const children = await db
    .collection(COLLECTION)
    .where("parentId", "==", id)
    .limit(1)
    .get();
  if (!children.empty) {
    throw new Error("Cannot delete category with subcategories");
  }
  await db.collection(COLLECTION).doc(id).delete();
  invalidateCatalogCache();
}
