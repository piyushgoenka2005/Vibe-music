/**
 * One-time migration: JSON catalog → Firestore (products, categories, brands).
 * Preserves existing image URLs (no Cloudinary upload).
 *
 * Run: npm run migrate:catalog
 * Dry run: npm run migrate:catalog -- --dry-run
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import {
  brandToFirestoreDoc,
  categoryToFirestoreDoc,
  deriveBrandsFromProducts,
  productToFirestoreDoc,
} from "../src/lib/catalog/migrationDocs";
import type { Brand } from "../src/types/brand";
import type { Category } from "../src/types/category";
import type { CatalogProduct } from "../src/types/catalog";

const ROOT = process.cwd();
const CATALOG_DIR = join(ROOT, "src/data/catalog");
const dryRun = process.argv.includes("--dry-run");
const replaceExisting = process.argv.includes("--replace");

interface MigrationReport {
  startedAt: string;
  completedAt: string;
  dryRun: boolean;
  source: {
    products: number;
    categories: number;
    brands: number;
  };
  products: { total: number; migrated: number };
  categories: { total: number; migrated: number };
  brands: { total: number; migrated: number };
  removed?: { products: number; brands: number };
}

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0]!;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin env vars. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY."
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

function loadJson<T>(filename: string): T {
  const raw = readFileSync(join(CATALOG_DIR, filename), "utf8");
  return JSON.parse(raw) as T;
}

async function batchDeleteCollection(
  db: FirebaseFirestore.Firestore,
  collection: string
): Promise<number> {
  if (dryRun) {
    const snapshot = await db.collection(collection).select().get();
    return snapshot.size;
  }

  let deleted = 0;
  let snapshot = await db.collection(collection).limit(400).get();

  while (!snapshot.empty) {
    let batch = db.batch();
    let ops = 0;
    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
      ops += 1;
      deleted += 1;
      if (ops >= 400) {
        await batch.commit();
        batch = db.batch();
        ops = 0;
      }
    }
    if (ops > 0) await batch.commit();
    snapshot = await db.collection(collection).limit(400).get();
  }

  return deleted;
}

async function batchSet(
  db: FirebaseFirestore.Firestore,
  collection: string,
  items: { id: string; data: Record<string, unknown> }[]
): Promise<number> {
  if (dryRun) return items.length;

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

async function main() {
  const startedAt = new Date().toISOString();
  const products = loadJson<CatalogProduct[]>("products.json");
  const categories = loadJson<Category[]>("categories.json");
  const brandsFromFile = loadJson<Brand[]>("brands.json");
  const brands = brandsFromFile.length
    ? brandsFromFile
    : deriveBrandsFromProducts(products);

  const report: MigrationReport = {
    startedAt,
    completedAt: "",
    dryRun,
    source: {
      products: products.length,
      categories: categories.length,
      brands: brands.length,
    },
    products: { total: products.length, migrated: 0 },
    categories: { total: categories.length, migrated: 0 },
    brands: { total: brands.length, migrated: 0 },
  };

  const db = getFirestore(getAdminApp());

  if (replaceExisting) {
    const removedProducts = await batchDeleteCollection(db, "products");
    const removedBrands = await batchDeleteCollection(db, "brands");
    report.removed = { products: removedProducts, brands: removedBrands };
    console.log(
      dryRun
        ? `Would remove ${removedProducts} products and ${removedBrands} brands`
        : `Removed ${removedProducts} products and ${removedBrands} brands`
    );
  }

  report.products.migrated = await batchSet(
    db,
    "products",
    products.map((product) => ({
      id: product.id,
      data: productToFirestoreDoc(product),
    }))
  );

  report.categories.migrated = await batchSet(
    db,
    "categories",
    categories.map((category, index) => ({
      id: category.id,
      data: categoryToFirestoreDoc(category, index),
    }))
  );

  report.brands.migrated = await batchSet(
    db,
    "brands",
    brands.map((brand) => ({
      id: brand.id,
      data: brandToFirestoreDoc(brand),
    }))
  );

  report.completedAt = new Date().toISOString();

  const reportPath = join(ROOT, "migration-report.json");
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(dryRun ? "Dry run complete." : "Migration complete.");
  console.log(`Products: ${report.products.migrated}/${report.products.total}`);
  console.log(`Categories: ${report.categories.migrated}/${report.categories.total}`);
  console.log(`Brands: ${report.brands.migrated}/${report.brands.total}`);
  console.log(`Report written to ${reportPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
