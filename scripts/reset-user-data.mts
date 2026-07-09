/**
 * Reset a user's storefront data and order numbering baseline.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/reset-user-data.mts <email> [uid]
 */
import fs from "fs";
import path from "path";

import { getAdminFirestore } from "../src/lib/firebase/admin";
import { getOrderYear, ORDER_ID_SEQUENCE_START } from "../src/lib/orderId";

const emailArg = process.argv[2]?.trim();
const uidArg = process.argv[3]?.trim();

if (!emailArg) {
  console.error(
    "Usage: npx tsx --env-file=.env.local scripts/reset-user-data.mts <email> [uid]"
  );
  process.exit(1);
}

const normalizedEmail = emailArg.toLowerCase();
const emailVariants = Array.from(
  new Set([normalizedEmail, emailArg].filter(Boolean))
);

const LOCAL_ORDERS_DIR = path.join(process.cwd(), ".data", "orders");
const LOCAL_ADDRESSES_DIR = path.join(process.cwd(), ".data", "addresses");

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

async function deleteOrdersForUser(): Promise<number> {
  const db = getAdminFirestore();
  const orderIds = new Set<string>();
  const orderDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];

  for (const variant of emailVariants) {
    const snap = await db.collection("orders").where("email", "==", variant).get();
    for (const doc of snap.docs) {
      if (!orderIds.has(doc.id)) {
        orderIds.add(doc.id);
        orderDocs.push(doc);
      }
    }
  }

  if (uidArg) {
    const snap = await db.collection("orders").where("userId", "==", uidArg).get();
    for (const doc of snap.docs) {
      if (!orderIds.has(doc.id)) {
        orderIds.add(doc.id);
        orderDocs.push(doc);
      }
    }
  }

  if (orderDocs.length > 0) {
    let batch = db.batch();
    let ops = 0;
    const batches: FirebaseFirestore.WriteBatch[] = [];

    for (const doc of orderDocs) {
      batch.delete(doc.ref);
      ops += 1;
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

  for (const orderId of orderIds) {
    await deleteDocsByQuery("payment_logs", "orderId", [orderId]);
    await deleteDocsByQuery("inventory_logs", "orderId", [orderId]);
    await deleteDocsByQuery("returnRequests", "orderId", [orderId]);
  }

  return orderDocs.length;
}

function deleteAllLocalOrders(): number {
  if (!fs.existsSync(LOCAL_ORDERS_DIR)) return 0;
  let deleted = 0;
  for (const fileName of fs.readdirSync(LOCAL_ORDERS_DIR)) {
    if (!fileName.endsWith(".json")) continue;
    fs.unlinkSync(path.join(LOCAL_ORDERS_DIR, fileName));
    deleted += 1;
  }
  return deleted;
}

function deleteLocalAddressesForUser(userId: string): number {
  if (!fs.existsSync(LOCAL_ADDRESSES_DIR)) return 0;
  const filePath = path.join(LOCAL_ADDRESSES_DIR, `${userId}.json`);
  if (!fs.existsSync(filePath)) return 0;
  fs.unlinkSync(filePath);
  return 1;
}

async function clearWishlist(userId: string): Promise<void> {
  await getAdminFirestore().collection("wishlists").doc(userId).set(
    {
      userId,
      items: [],
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

async function clearAddresses(userId: string): Promise<number> {
  return deleteDocsByQuery("addresses", "userId", [userId]);
}

async function resetOrderCounter(): Promise<void> {
  const year = getOrderYear();
  writeLocalCounter(year, ORDER_ID_SEQUENCE_START - 1);

  try {
    const counterRef = getAdminFirestore()
      .collection("counters")
      .doc(`orders-${year}`);

    await counterRef.set(
      {
        lastSequence: ORDER_ID_SEQUENCE_START - 1,
        year,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn(
      "Firestore counter reset skipped:",
      error instanceof Error ? error.message : error
    );
  }
}

function writeLocalCounter(year: number, lastSequence: number): void {
  const countersDir = path.join(process.cwd(), ".data", "counters");
  fs.mkdirSync(countersDir, { recursive: true });
  fs.writeFileSync(
    path.join(countersDir, `orders-${year}.json`),
    `${JSON.stringify(
      {
        lastSequence,
        year,
        updatedAt: new Date().toISOString(),
      },
      null,
      2
    )}\n`,
    "utf8"
  );
}

async function main() {
  console.log(`Resetting account data for ${normalizedEmail}...`);

  let ordersDeleted = 0;
  try {
    ordersDeleted = await deleteOrdersForUser();
  } catch (error) {
    console.warn(
      "Firestore order cleanup skipped:",
      error instanceof Error ? error.message : error
    );
  }

  const localOrdersDeleted = deleteAllLocalOrders();

  let addressesDeleted = 0;
  let localAddressesDeleted = 0;
  if (uidArg) {
    try {
      await clearWishlist(uidArg);
    } catch (error) {
      console.warn(
        "Firestore wishlist cleanup skipped:",
        error instanceof Error ? error.message : error
      );
    }

    try {
      addressesDeleted = await clearAddresses(uidArg);
    } catch (error) {
      console.warn(
        "Firestore address cleanup skipped:",
        error instanceof Error ? error.message : error
      );
    }

    localAddressesDeleted = deleteLocalAddressesForUser(uidArg);
  }

  await resetOrderCounter();

  console.log("\nReset complete:");
  console.log(`  Firestore orders deleted: ${ordersDeleted}`);
  console.log(`  Local order files deleted: ${localOrdersDeleted}`);
  if (uidArg) {
    console.log(`  Wishlist cleared for uid: ${uidArg}`);
    console.log(`  Firestore addresses deleted: ${addressesDeleted}`);
    console.log(`  Local address files deleted: ${localAddressesDeleted}`);
  }
  console.log(
    `  Order counter reset — next order id: ${String(ORDER_ID_SEQUENCE_START).padStart(6, "0")}-${getOrderYear()}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
