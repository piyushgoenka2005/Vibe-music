/**
 * @deprecated Use npm run migrate:products instead.
 * One-time bootstrap: copies catalog products into Firestore.
 * Run: npm run seed:products
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { CatalogProduct } from "../src/types/catalog";

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0]!;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin env vars for seeding.");
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

async function main() {
  const productsPath = join(process.cwd(), "src/data/catalog/products.json");
  const products = JSON.parse(readFileSync(productsPath, "utf8")) as CatalogProduct[];

  const db = getFirestore(getAdminApp());
  const batch = db.batch();

  products.forEach((product) => {
    const ref = db.collection("products").doc(product.id);
    batch.set(ref, { ...product, stockQuantity: product.stock }, { merge: true });
  });

  await batch.commit();
  console.log(`Seeded ${products.length} products into Firestore.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
