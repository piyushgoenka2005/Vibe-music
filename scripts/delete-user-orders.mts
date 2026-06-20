/**
 * Permanently delete all orders (and related logs) for a customer email.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/delete-user-orders.mts <email>
 */
import fs from "fs";
import path from "path";

import { getAdminFirestore } from "../src/lib/firebase/admin";

const emailArg = process.argv[2]?.trim();

if (!emailArg) {
  console.error(
    "Usage: npx tsx --env-file=.env.local scripts/delete-user-orders.mts <email>"
  );
  process.exit(1);
}

const normalizedEmail = emailArg.toLowerCase();
const emailVariants = Array.from(
  new Set([normalizedEmail, emailArg].filter(Boolean))
);

const LOCAL_ORDERS_DIR = path.join(process.cwd(), ".data", "orders");

async function deleteDocsByQuery(
  collection: string,
  field: string,
  values: string[]
): Promise<number> {
  if (values.length === 0) return 0;

  const db = getAdminFirestore();
  let deleted = 0;

  for (const value of values) {
    const snap = await db.collection(collection).where(field, "==", value).get();
    if (snap.empty) continue;

    const batches: FirebaseFirestore.WriteBatch[] = [];
    let batch = db.batch();
    let ops = 0;

    for (const doc of snap.docs) {
      batch.delete(doc.ref);
      ops += 1;
      deleted += 1;

      if (ops >= 450) {
        batches.push(batch);
        batch = db.batch();
        ops = 0;
      }
    }

    if (ops > 0) batches.push(batch);

    for (const writeBatch of batches) {
      await writeBatch.commit();
    }
  }

  return deleted;
}

function deleteLocalOrdersForEmail(orderIds: Set<string>): number {
  if (!fs.existsSync(LOCAL_ORDERS_DIR)) return 0;

  let deleted = 0;

  for (const fileName of fs.readdirSync(LOCAL_ORDERS_DIR)) {
    if (!fileName.endsWith(".json")) continue;

    const filePath = path.join(LOCAL_ORDERS_DIR, fileName);
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as { id?: string; email?: string };

    const matchesEmail = emailVariants.some(
      (variant) => parsed.email?.toLowerCase() === variant.toLowerCase()
    );
    const matchesId = parsed.id ? orderIds.has(parsed.id) : false;

    if (matchesEmail || matchesId) {
      fs.unlinkSync(filePath);
      deleted += 1;
    }
  }

  return deleted;
}

async function main() {
  const db = getAdminFirestore();
  const orderIds = new Set<string>();
  const orderDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];

  for (const variant of emailVariants) {
    const snap = await db
      .collection("orders")
      .where("email", "==", variant)
      .get();

    for (const doc of snap.docs) {
      if (!orderIds.has(doc.id)) {
        orderIds.add(doc.id);
        orderDocs.push(doc);
      }
    }
  }

  console.log(`Found ${orderDocs.length} order(s) for ${normalizedEmail}`);

  if (orderDocs.length === 0) {
    const localOnly = deleteLocalOrdersForEmail(orderIds);
    if (localOnly > 0) {
      console.log(`Deleted ${localOnly} local order file(s).`);
    } else {
      console.log("No orders found in Firestore or local store.");
    }
    return;
  }

  for (const doc of orderDocs) {
    const data = doc.data();
    console.log(`  - ${doc.id} (${data.createdAt ?? "unknown date"})`);
  }

  let batch = db.batch();
  let ops = 0;
  const orderBatches: FirebaseFirestore.WriteBatch[] = [];

  for (const doc of orderDocs) {
    batch.delete(doc.ref);
    ops += 1;
    if (ops >= 450) {
      orderBatches.push(batch);
      batch = db.batch();
      ops = 0;
    }
  }
  if (ops > 0) orderBatches.push(batch);

  for (const writeBatch of orderBatches) {
    await writeBatch.commit();
  }

  const orderIdList = Array.from(orderIds);
  let paymentLogsDeleted = 0;
  let inventoryLogsDeleted = 0;

  for (const orderId of orderIdList) {
    paymentLogsDeleted += await deleteDocsByQuery(
      "payment_logs",
      "orderId",
      [orderId]
    );
    inventoryLogsDeleted += await deleteDocsByQuery(
      "inventory_logs",
      "orderId",
      [orderId]
    );
  }

  const localDeleted = deleteLocalOrdersForEmail(orderIds);

  console.log("\nDeletion complete:");
  console.log(`  Orders deleted: ${orderDocs.length}`);
  console.log(`  Payment logs deleted: ${paymentLogsDeleted}`);
  console.log(`  Inventory logs deleted: ${inventoryLogsDeleted}`);
  console.log(`  Local order files deleted: ${localDeleted}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
