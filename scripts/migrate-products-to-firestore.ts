/**
 * One-time migration: JSON catalog → Firestore.
 * Preserves existing image URLs (no Cloudinary upload).
 *
 * Run: npm run migrate:products
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { Brand } from "../src/types/brand";
import type { Category } from "../src/types/category";
import type { CatalogProduct } from "../src/types/catalog";

const ROOT = process.cwd();
const CATALOG_DIR = join(ROOT, "src/data/catalog");

interface MigrationReport {
  startedAt: string;
  completedAt: string;
  products: { total: number; migrated: number; skipped: number; errors: string[] };
  categories: { total: number; migrated: number };
  brands: { total: number; migrated: number };
}

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0]!;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin env vars. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.");
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

function loadJson<T>(filename: string): T {
  const raw = readFileSync(join(CATALOG_DIR, filename), "utf8");
  return JSON.parse(raw) as T;
}

function deriveBrands(products: CatalogProduct[]): Brand[] {
  const map = new Map<string, Brand>();
  for (const p of products) {
    if (!map.has(p.brandSlug)) {
      map.set(p.brandSlug, { id: p.brandSlug, name: p.brand, slug: p.brandSlug });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

async function batchSet(
  db: FirebaseFirestore.Firestore,
  collection: string,
  items: { id: string; data: Record<string, unknown> }[]
): Promise<number> {
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
  const report: MigrationReport = {
    startedAt,
    completedAt: "",
    products: { total: 0, migrated: 0, skipped: 0, errors: [] },
    categories: { total: 0, migrated: 0 },
    brands: { total: 0, migrated: 0 },
  };

  const products = loadJson<CatalogProduct[]>("products.json");
  const categories = loadJson<Category[]>("categories.json");
  const brandsFromFile = loadJson<Brand[]>("brands.json");

  report.products.total = products.length;
  report.categories.total = categories.length;

  const db = getFirestore(getAdminApp());

  const productDocs = products.map((p) => ({
    id: p.id,
    data: {
      ...p,
      stockQuantity: p.stock,
      images: p.images?.length ? p.images : p.image ? [p.image] : [],
    },
  }));

  report.products.migrated = await batchSet(db, "products", productDocs);

  const categoryDocs = categories.map((c) => ({
    id: c.id,
    data: { name: c.name, slug: c.slug, description: c.description ?? "" },
  }));
  report.categories.migrated = await batchSet(db, "categories", categoryDocs);

  const brands = brandsFromFile.length ? brandsFromFile : deriveBrands(products);
  report.brands.total = brands.length;
  const brandDocs = brands.map((b) => ({
    id: b.id,
    data: { name: b.name, slug: b.slug },
  }));
  report.brands.migrated = await batchSet(db, "brands", brandDocs);

  report.completedAt = new Date().toISOString();

  const reportPath = join(ROOT, "migration-report.json");
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log("Migration complete.");
  console.log(`Products: ${report.products.migrated}/${report.products.total}`);
  console.log(`Categories: ${report.categories.migrated}/${report.categories.total}`);
  console.log(`Brands: ${report.brands.migrated}/${report.brands.total}`);
  console.log(`Report written to ${reportPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
