import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { loadBrands, saveBrands } from "@/lib/server/catalogRepository";
import { invalidateCatalogCache } from "@/lib/server/firestoreCatalogRepository";
import { slugify } from "@/lib/slug";
import type { Brand } from "@/types/brand";

const COLLECTION = "brands";

function normalizeBrand(id: string, data: FirebaseFirestore.DocumentData): Brand {
  return {
    id,
    name: String(data.name ?? ""),
    slug: String(data.slug ?? slugify(String(data.name ?? ""))),
  };
}

async function staticBrands(): Promise<Brand[]> {
  return loadBrands();
}

async function syncBrandsJson(brands: Brand[]): Promise<void> {
  saveBrands([...brands].sort((a, b) => a.name.localeCompare(b.name)));
  invalidateCatalogCache();
}

async function seedBrandsFromStatic(): Promise<Brand[]> {
  const brands = await staticBrands();
  if (brands.length === 0) return [];

  const db = getAdminFirestore();
  const batch = db.batch();
  for (const brand of brands) {
    batch.set(db.collection(COLLECTION).doc(brand.id), brand);
  }
  await batch.commit();
  return brands;
}

export async function listBrands(): Promise<Brand[]> {
  try {
    const db = getAdminFirestore();
    const snap = await db.collection(COLLECTION).orderBy("name", "asc").get();
    if (snap.empty) {
      return seedBrandsFromStatic();
    }
    return snap.docs.map((doc) => normalizeBrand(doc.id, doc.data()));
  } catch {
    return staticBrands();
  }
}

export async function getBrandById(id: string): Promise<Brand | null> {
  const db = getAdminFirestore();
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return normalizeBrand(doc.id, doc.data()!);
}

export async function createBrand(input: {
  name: string;
  slug?: string;
}): Promise<Brand> {
  const db = getAdminFirestore();
  const slug = (input.slug?.trim() || slugify(input.name)).toLowerCase();
  const record: Brand = {
    id: slug,
    name: input.name.trim(),
    slug,
  };
  await db.collection(COLLECTION).doc(slug).set(record);
  await syncBrandsJson(await listBrands());
  return record;
}

export async function updateBrand(
  id: string,
  patch: Partial<Pick<Brand, "name" | "slug">>
): Promise<Brand> {
  const db = getAdminFirestore();
  const existing = await getBrandById(id);
  if (!existing) throw new Error("Brand not found");

  const nextSlug = patch.slug?.trim() || existing.slug;
  const nextName = patch.name?.trim() || existing.name;
  const record: Brand = { id, name: nextName, slug: nextSlug };

  if (nextSlug !== id) {
    await db.collection(COLLECTION).doc(nextSlug).set(record);
    await db.collection(COLLECTION).doc(id).delete();
  } else {
    await db.collection(COLLECTION).doc(id).update({
      name: nextName,
      slug: nextSlug,
    });
  }

  await syncBrandsJson(await listBrands());
  return record;
}

export async function deleteBrand(id: string): Promise<void> {
  const db = getAdminFirestore();
  await db.collection(COLLECTION).doc(id).delete();
  await syncBrandsJson(await listBrands());
}
