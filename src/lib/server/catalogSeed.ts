import "server-only";

import {
  brandToFirestoreDoc,
  categoryToFirestoreDoc,
  deriveBrandsFromProducts,
  productToFirestoreDoc,
} from "@/lib/catalog/migrationDocs";
import {
  loadBrands,
  loadCategories,
  loadProducts,
} from "@/lib/server/catalogRepository";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { Brand } from "@/types/brand";
import type { Category } from "@/types/category";
import type { CatalogProduct } from "@/types/catalog";

const PRODUCTS = "products";
const CATEGORIES = "categories";
const BRANDS = "brands";

export interface JsonCatalogSnapshot {
  products: CatalogProduct[];
  categories: Category[];
  brands: Brand[];
}

/** Read the JSON catalog files used as migration source data. */
export function loadJsonCatalogSnapshot(): JsonCatalogSnapshot {
  const products = loadProducts();
  const categories = loadCategories().map((category, index) => ({
    ...category,
    isFeatured: index < 8,
    sortOrder: index,
  }));
  const brandsFromFile = loadBrands();
  const brands = brandsFromFile.length
    ? brandsFromFile
    : deriveBrandsFromProducts(products);

  return { products, categories, brands };
}

async function batchSetDocs(
  collection: string,
  items: { id: string; data: Record<string, unknown> }[]
): Promise<number> {
  const db = getAdminFirestore();
  let batch = db.batch();
  let ops = 0;
  let count = 0;

  for (const item of items) {
    batch.set(db.collection(collection).doc(item.id), item.data, { merge: true });
    ops += 1;
    count += 1;
    if (ops >= 400) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }

  if (ops > 0) await batch.commit();
  return count;
}

export interface CatalogSeedResult {
  products: number;
  categories: number;
  brands: number;
}

/** Write JSON catalog data into Firestore collections. */
export async function seedCatalogFromJson(): Promise<CatalogSeedResult> {
  const { products, categories, brands } = loadJsonCatalogSnapshot();

  const productCount = await batchSetDocs(
    PRODUCTS,
    products.map((product) => ({
      id: product.id,
      data: productToFirestoreDoc(product),
    }))
  );

  const categoryCount = await batchSetDocs(
    CATEGORIES,
    categories.map((category, index) => ({
      id: category.id,
      data: categoryToFirestoreDoc(category, index),
    }))
  );

  const brandCount = await batchSetDocs(
    BRANDS,
    brands.map((brand) => ({
      id: brand.id,
      data: brandToFirestoreDoc(brand),
    }))
  );

  return {
    products: productCount,
    categories: categoryCount,
    brands: brandCount,
  };
}

/** Returns true when any core catalog collection is empty. */
export async function isCatalogEmpty(): Promise<boolean> {
  const db = getAdminFirestore();
  const [products, categories] = await Promise.all([
    db.collection(PRODUCTS).limit(1).get(),
    db.collection(CATEGORIES).limit(1).get(),
  ]);
  return products.empty || categories.empty;
}
