import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { invalidateCatalogCache } from "@/lib/server/firestoreCatalogRepository";
import {
  getAvailableStock,
  stockToAvailability,
  validateAvailability,
} from "@/lib/inventory/stockMath";
import type {
  InventoryLog,
  InventoryLogAction,
  OrderInventoryLine,
  ProductStockSnapshot,
} from "@/types/inventory";
import { DEFAULT_LOW_STOCK_THRESHOLD } from "@/types/inventory";
import type { OrderInventoryStatus } from "@/types/inventory";
import type { DocumentReference, Transaction } from "firebase-admin/firestore";

const PRODUCTS = "products";
const ORDERS = "orders";
const INVENTORY_LOGS = "inventory_logs";

function productRef(productId: string): DocumentReference {
  return getAdminFirestore().collection(PRODUCTS).doc(productId);
}

function readSnapshot(
  productId: string,
  data: FirebaseFirestore.DocumentData
): ProductStockSnapshot {
  const stock = Number(data.stock ?? data.stockQuantity ?? 0);
  const reservedStock = Number(data.reservedStock ?? 0);
  return {
    productId,
    sku: String(data.sku ?? ""),
    name: String(data.name ?? ""),
    stock,
    reservedStock,
    lowStockThreshold: Number(
      data.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD
    ),
    status: String(data.status ?? "active"),
  };
}

function createLogId(): string {
  return `inv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function writeLogInTransaction(
  tx: Transaction,
  log: Omit<InventoryLog, "id"> & { id?: string }
): void {
  const id = log.id ?? createLogId();
  const ref = getAdminFirestore().collection(INVENTORY_LOGS).doc(id);
  tx.set(ref, {
    id,
    productId: log.productId,
    sku: log.sku,
    orderId: log.orderId ?? null,
    previousStock: log.previousStock,
    newStock: log.newStock,
    quantityChanged: log.quantityChanged,
    action: log.action,
    adminId: log.adminId ?? null,
    timestamp: log.timestamp,
    previousReserved: log.previousReserved ?? null,
    newReserved: log.newReserved ?? null,
    note: log.note ?? null,
  });
}

export async function fetchProductStockSnapshots(
  productIds: string[]
): Promise<Map<string, ProductStockSnapshot>> {
  const db = getAdminFirestore();
  const uniqueIds = [...new Set(productIds)];
  const map = new Map<string, ProductStockSnapshot>();

  await Promise.all(
    uniqueIds.map(async (productId) => {
      const doc = await db.collection(PRODUCTS).doc(productId).get();
      if (!doc.exists) return;
      map.set(productId, readSnapshot(productId, doc.data()!));
    })
  );

  return map;
}

function readVariantStock(
  data: FirebaseFirestore.DocumentData,
  variantId: string
): number | null {
  const variants = data.detail?.variants;
  if (!Array.isArray(variants)) return null;
  const variant = variants.find((entry) => entry.id === variantId);
  if (!variant) return null;

  if (variant.stock !== undefined && variant.stock !== null) {
    return Number(variant.stock);
  }

  const parentStock = Number(data.stock ?? data.stockQuantity ?? 0);
  const reservedStock = Number(data.reservedStock ?? 0);
  return getAvailableStock(parentStock, reservedStock);
}

function buildVariantStockPatch(
  data: FirebaseFirestore.DocumentData,
  variantId: string,
  delta: number
): Record<string, unknown> {
  const detail = data.detail ?? {};
  const variants = Array.isArray(detail.variants) ? [...detail.variants] : [];
  const index = variants.findIndex((entry) => entry.id === variantId);
  if (index < 0) {
    throw new Error(`Variant not found: ${variantId}`);
  }

  const currentStock =
    variants[index].stock !== undefined && variants[index].stock !== null
      ? Number(variants[index].stock)
      : (readVariantStock(data, variantId) ?? 0);
  const newStock = currentStock + delta;
  if (newStock < 0) {
    throw new Error(`Invalid variant stock for ${variantId}`);
  }

  variants[index] = {
    ...variants[index],
    stock: newStock,
    availability:
      newStock <= 0 ? "out-of-stock" : newStock <= 5 ? "limited" : "in-stock",
  };

  const parentStock = variants.reduce(
    (sum, entry) => sum + Number(entry.stock ?? 0),
    0
  );
  const reservedStock = Number(data.reservedStock ?? 0);
  const now = new Date().toISOString();

  return {
    detail: { ...detail, variants },
    stock: parentStock,
    stockQuantity: parentStock,
    availability: stockToAvailability(parentStock, reservedStock),
    updatedAt: now,
  };
}

async function reserveVariantStockInTransaction(
  tx: Transaction,
  orderId: string,
  items: OrderInventoryLine[],
  productDocs: Map<string, FirebaseFirestore.DocumentData>,
  now: string
): Promise<void> {
  applyVariantStockChangesInTransaction(
    tx,
    orderId,
    items,
    productDocs,
    (item) => -item.quantity,
    "order_created",
    now
  );
}

async function fulfillVariantStockInTransaction(
  tx: Transaction,
  orderId: string,
  items: OrderInventoryLine[],
  productDocs: Map<string, FirebaseFirestore.DocumentData>,
  action: InventoryLogAction,
  now: string,
  adminId?: string | null
): Promise<void> {
  applyVariantStockChangesInTransaction(
    tx,
    orderId,
    items,
    productDocs,
    (item) => (action === "order_cancelled" ? item.quantity : -item.quantity),
    action,
    now,
    adminId
  );
}

export async function validateStockAvailability(
  items: OrderInventoryLine[]
): Promise<void> {
  const db = getAdminFirestore();
  const variantErrors: string[] = [];
  const parentItems: OrderInventoryLine[] = [];

  for (const item of items) {
    if (!item.variantId) {
      parentItems.push(item);
      continue;
    }

    const doc = await db.collection(PRODUCTS).doc(item.productId).get();
    if (!doc.exists) {
      variantErrors.push(`${item.name ?? item.productId}: product not found`);
      continue;
    }

    const available = readVariantStock(doc.data()!, item.variantId);
    if (available === null) {
      variantErrors.push(`${item.name ?? item.productId}: variant not found`);
      continue;
    }

    if (item.quantity > available) {
      variantErrors.push(
        `${item.name ?? item.productId}: requested ${item.quantity}, available ${available}`
      );
    }
  }

  if (variantErrors.length > 0) {
    throw new Error(`Insufficient stock: ${variantErrors.join("; ")}`);
  }

  if (parentItems.length === 0) return;

  const snapshots = await fetchProductStockSnapshots(
    parentItems.map((item) => item.productId)
  );

  const errors = validateAvailability(
    parentItems.map((item) => ({
      productId: item.productId,
      name: item.name ?? item.productId,
      quantity: item.quantity,
    })),
    new Map(
      [...snapshots.entries()].map(([id, snap]) => [
        id,
        {
          name: snap.name,
          stock: snap.stock,
          reservedStock: snap.reservedStock,
          status: snap.status,
        },
      ])
    )
  );

  if (errors.length > 0) {
    const detail = errors
      .map(
        (e) =>
          `${e.name}: requested ${e.quantity}, available ${e.available}`
      )
      .join("; ");
    throw new Error(`Insufficient stock: ${detail}`);
  }
}

async function loadSnapshotsInTransaction(
  tx: Transaction,
  items: OrderInventoryLine[]
): Promise<Map<string, ProductStockSnapshot>> {
  const docs = await loadProductDocsInTransaction(
    tx,
    items.map((item) => item.productId)
  );
  const map = new Map<string, ProductStockSnapshot>();
  for (const [productId, data] of docs) {
    map.set(productId, readSnapshot(productId, data));
  }
  return map;
}

async function loadProductDocsInTransaction(
  tx: Transaction,
  productIds: string[]
): Promise<Map<string, FirebaseFirestore.DocumentData>> {
  const map = new Map<string, FirebaseFirestore.DocumentData>();
  const uniqueIds = [...new Set(productIds)];

  for (const productId of uniqueIds) {
    const doc = await tx.get(productRef(productId));
    if (!doc.exists) {
      throw new Error(`Product not found: ${productId}`);
    }
    map.set(productId, doc.data()!);
  }

  return map;
}

function cloneProductData(
  data: FirebaseFirestore.DocumentData
): FirebaseFirestore.DocumentData {
  return JSON.parse(JSON.stringify(data)) as FirebaseFirestore.DocumentData;
}

function writeVariantStockChangeInTransaction(
  tx: Transaction,
  orderId: string,
  item: OrderInventoryLine,
  data: FirebaseFirestore.DocumentData,
  delta: number,
  action: InventoryLogAction,
  now: string,
  adminId?: string | null
): FirebaseFirestore.DocumentData {
  if (!item.variantId) {
    throw new Error("Variant ID required");
  }

  const previousStock = readVariantStock(data, item.variantId) ?? 0;
  const patch = buildVariantStockPatch(data, item.variantId, delta);
  const newStock = previousStock + delta;

  tx.update(productRef(item.productId), patch);
  writeLogInTransaction(tx, {
    productId: item.productId,
    sku: item.variantId,
    orderId,
    previousStock,
    newStock,
    quantityChanged: delta,
    action,
    adminId: adminId ?? null,
    timestamp: now,
  });

  return { ...data, ...patch };
}

function applyVariantStockChangesInTransaction(
  tx: Transaction,
  orderId: string,
  items: OrderInventoryLine[],
  productDocs: Map<string, FirebaseFirestore.DocumentData>,
  deltaForItem: (item: OrderInventoryLine) => number,
  action: InventoryLogAction,
  now: string,
  adminId?: string | null
): void {
  const byProduct = new Map<string, OrderInventoryLine[]>();
  for (const item of items) {
    if (!item.variantId) continue;
    const list = byProduct.get(item.productId) ?? [];
    list.push(item);
    byProduct.set(item.productId, list);
  }

  for (const [productId, productItems] of byProduct) {
    let data = cloneProductData(productDocs.get(productId)!);
    for (const item of productItems) {
      data = writeVariantStockChangeInTransaction(
        tx,
        orderId,
        item,
        data,
        deltaForItem(item),
        action,
        now,
        adminId
      );
    }
  }
}

export async function reserveStockForOrder(
  orderId: string,
  items: OrderInventoryLine[]
): Promise<void> {
  const db = getAdminFirestore();
  const orderRef = db.collection(ORDERS).doc(orderId);
  const parentItems = items.filter((item) => !item.variantId);
  const variantItems = items.filter((item) => item.variantId);

  await db.runTransaction(async (tx) => {
    const orderDoc = await tx.get(orderRef);
    if (!orderDoc.exists) {
      throw new Error("Order not found");
    }

    const orderData = orderDoc.data()!;
    const currentStatus = (orderData.inventoryStatus ??
      "none") as OrderInventoryStatus;

    if (currentStatus === "reserved" || currentStatus === "fulfilled") {
      return;
    }

    const productDocs = await loadProductDocsInTransaction(
      tx,
      items.map((item) => item.productId)
    );

    if (parentItems.length > 0) {
      const snapshots = new Map<string, ProductStockSnapshot>();
      for (const item of parentItems) {
        const data = productDocs.get(item.productId)!;
        snapshots.set(item.productId, readSnapshot(item.productId, data));
      }

      const errors = validateAvailability(
        parentItems.map((item) => ({
          productId: item.productId,
          name: snapshots.get(item.productId)?.name ?? item.productId,
          quantity: item.quantity,
        })),
        new Map(
          [...snapshots.entries()].map(([id, snap]) => [
            id,
            {
              name: snap.name,
              stock: snap.stock,
              reservedStock: snap.reservedStock,
              status: snap.status,
            },
          ])
        )
      );

      if (errors.length > 0) {
        const detail = errors
          .map(
            (e) =>
              `${e.name}: requested ${e.quantity}, available ${e.available}`
          )
          .join("; ");
        throw new Error(`Insufficient stock: ${detail}`);
      }
    }

    for (const item of variantItems) {
      const data = productDocs.get(item.productId)!;
      const available = readVariantStock(data, item.variantId!) ?? 0;
      if (item.quantity > available) {
        throw new Error(
          `Insufficient variant stock for ${item.name ?? item.variantId}: requested ${item.quantity}, available ${available}`
        );
      }
    }

    const now = new Date().toISOString();

    for (const item of parentItems) {
      const snapshot = readSnapshot(item.productId, productDocs.get(item.productId)!);
      const previousReserved = snapshot.reservedStock;
      const newReserved = previousReserved + item.quantity;

      tx.update(productRef(item.productId), {
        reservedStock: newReserved,
        updatedAt: now,
      });

      writeLogInTransaction(tx, {
        productId: item.productId,
        sku: snapshot.sku,
        orderId,
        previousStock: snapshot.stock,
        newStock: snapshot.stock,
        quantityChanged: item.quantity,
        action: "order_created",
        adminId: null,
        timestamp: now,
        previousReserved,
        newReserved,
      });
    }

    await reserveVariantStockInTransaction(
      tx,
      orderId,
      variantItems,
      productDocs,
      now
    );

    tx.update(orderRef, {
      inventoryStatus: "reserved",
      variantInventoryHeld: variantItems.length > 0,
      updatedAt: now,
    });
  });

  invalidateCatalogCache();
}

export async function fulfillReservedStockForOrder(
  orderId: string,
  items: OrderInventoryLine[]
): Promise<void> {
  const db = getAdminFirestore();
  const orderRef = db.collection(ORDERS).doc(orderId);

  await db.runTransaction(async (tx) => {
    const orderDoc = await tx.get(orderRef);
    if (!orderDoc.exists) {
      throw new Error("Order not found");
    }

    const orderData = orderDoc.data()!;
    const currentStatus = (orderData.inventoryStatus ??
      "none") as OrderInventoryStatus;
    const variantInventoryHeld = Boolean(orderData.variantInventoryHeld);

    if (currentStatus === "fulfilled") {
      return;
    }

    if (currentStatus !== "reserved") {
      throw new Error(
        `Cannot fulfill inventory for order in status: ${currentStatus}`
      );
    }

    const parentItems = items.filter((item) => !item.variantId);
    const variantItems = items.filter((item) => item.variantId);
    const productDocs = await loadProductDocsInTransaction(
      tx,
      items.map((item) => item.productId)
    );
    const snapshots = new Map<string, ProductStockSnapshot>();
    for (const item of parentItems) {
      snapshots.set(
        item.productId,
        readSnapshot(item.productId, productDocs.get(item.productId)!)
      );
    }
    const now = new Date().toISOString();

    for (const item of parentItems) {
      const snap = snapshots.get(item.productId)!;
      const previousStock = snap.stock;
      const previousReserved = snap.reservedStock;
      const newStock = previousStock - item.quantity;
      const newReserved = previousReserved - item.quantity;

      if (newStock < 0 || newReserved < 0) {
        throw new Error(`Invalid stock state for product ${item.productId}`);
      }

      tx.update(productRef(item.productId), {
        stock: newStock,
        stockQuantity: newStock,
        reservedStock: newReserved,
        availability: stockToAvailability(newStock, newReserved),
        updatedAt: now,
      });

      writeLogInTransaction(tx, {
        productId: item.productId,
        sku: snap.sku,
        orderId,
        previousStock,
        newStock,
        quantityChanged: -item.quantity,
        action: "order_paid",
        adminId: null,
        timestamp: now,
        previousReserved,
        newReserved,
      });
    }

    if (!variantInventoryHeld) {
      await fulfillVariantStockInTransaction(
        tx,
        orderId,
        variantItems,
        productDocs,
        "order_paid",
        now
      );
    }

    tx.update(orderRef, {
      inventoryStatus: "fulfilled",
      updatedAt: now,
    });
  });

  invalidateCatalogCache();
}

/** COD and other immediate-commit flows: reserve + fulfill atomically. */
export async function reserveAndFulfillStockForOrder(
  orderId: string,
  items: OrderInventoryLine[]
): Promise<void> {
  const db = getAdminFirestore();
  const orderRef = db.collection(ORDERS).doc(orderId);

  await db.runTransaction(async (tx) => {
    const orderDoc = await tx.get(orderRef);
    if (!orderDoc.exists) {
      throw new Error("Order not found");
    }

    const orderData = orderDoc.data()!;
    const currentStatus = (orderData.inventoryStatus ??
      "none") as OrderInventoryStatus;

    if (currentStatus === "fulfilled") {
      return;
    }

    const productDocs = await loadProductDocsInTransaction(
      tx,
      items.map((item) => item.productId)
    );
    const snapshots = new Map<string, ProductStockSnapshot>();
    for (const [productId, data] of productDocs) {
      snapshots.set(productId, readSnapshot(productId, data));
    }

    const parentItems = items.filter((item) => !item.variantId);
    const variantItems = items.filter((item) => item.variantId);

    const errors = validateAvailability(
      items.map((item) => ({
        productId: item.productId,
        name: snapshots.get(item.productId)?.name ?? item.productId,
        quantity: item.quantity,
      })),
      new Map(
        [...snapshots.entries()].map(([id, snap]) => [
          id,
          {
            name: snap.name,
            stock: snap.stock,
            reservedStock: snap.reservedStock,
            status: snap.status,
          },
        ])
      )
    );

    if (errors.length > 0) {
      const detail = errors
        .map(
          (e) =>
            `${e.name}: requested ${e.quantity}, available ${e.available}`
        )
        .join("; ");
      throw new Error(`Insufficient stock: ${detail}`);
    }

    for (const item of variantItems) {
      const data = productDocs.get(item.productId)!;
      const available = readVariantStock(data, item.variantId!) ?? 0;
      if (item.quantity > available) {
        throw new Error(
          `Insufficient variant stock for ${item.name ?? item.variantId}: requested ${item.quantity}, available ${available}`
        );
      }
    }

    const now = new Date().toISOString();

    for (const item of parentItems) {
      const snap = snapshots.get(item.productId)!;
      const previousStock = snap.stock;
      const newStock = previousStock - item.quantity;

      tx.update(productRef(item.productId), {
        stock: newStock,
        stockQuantity: newStock,
        reservedStock: snap.reservedStock,
        availability: stockToAvailability(newStock, snap.reservedStock),
        updatedAt: now,
      });

      writeLogInTransaction(tx, {
        productId: item.productId,
        sku: snap.sku,
        orderId,
        previousStock,
        newStock,
        quantityChanged: -item.quantity,
        action: "order_paid",
        adminId: null,
        timestamp: now,
        previousReserved: snap.reservedStock,
        newReserved: snap.reservedStock,
      });
    }

    await fulfillVariantStockInTransaction(
      tx,
      orderId,
      variantItems,
      productDocs,
      "order_paid",
      now
    );

    tx.update(orderRef, {
      inventoryStatus: "fulfilled",
      updatedAt: now,
    });
  });

  invalidateCatalogCache();
}

export async function releaseReservedStockForOrder(
  orderId: string,
  items: OrderInventoryLine[]
): Promise<void> {
  const db = getAdminFirestore();
  const orderRef = db.collection(ORDERS).doc(orderId);

  await db.runTransaction(async (tx) => {
    const orderDoc = await tx.get(orderRef);
    if (!orderDoc.exists) {
      throw new Error("Order not found");
    }

    const orderData = orderDoc.data()!;
    const currentStatus = (orderData.inventoryStatus ??
      "none") as OrderInventoryStatus;
    const variantInventoryHeld = Boolean(orderData.variantInventoryHeld);

    if (currentStatus === "released" || currentStatus === "fulfilled") {
      return;
    }

    if (currentStatus !== "reserved") {
      return;
    }

    const parentItems = items.filter((item) => !item.variantId);
    const variantItems = items.filter((item) => item.variantId);
    const productDocs = await loadProductDocsInTransaction(
      tx,
      items.map((item) => item.productId)
    );
    const snapshots = new Map<string, ProductStockSnapshot>();
    for (const item of parentItems) {
      snapshots.set(
        item.productId,
        readSnapshot(item.productId, productDocs.get(item.productId)!)
      );
    }
    const now = new Date().toISOString();

    for (const item of parentItems) {
      const snap = snapshots.get(item.productId)!;
      const previousReserved = snap.reservedStock;
      const newReserved = Math.max(0, previousReserved - item.quantity);

      tx.update(productRef(item.productId), {
        reservedStock: newReserved,
        availability: stockToAvailability(snap.stock, newReserved),
        updatedAt: now,
      });

      writeLogInTransaction(tx, {
        productId: item.productId,
        sku: snap.sku,
        orderId,
        previousStock: snap.stock,
        newStock: snap.stock,
        quantityChanged: -item.quantity,
        action: "order_cancelled",
        adminId: null,
        timestamp: now,
        previousReserved,
        newReserved,
      });
    }

    if (variantInventoryHeld) {
      await fulfillVariantStockInTransaction(
        tx,
        orderId,
        variantItems,
        productDocs,
        "order_cancelled",
        now
      );
    }

    tx.update(orderRef, {
      inventoryStatus: "released",
      updatedAt: now,
    });
  });

  invalidateCatalogCache();
}

export async function restoreStockForCancelledOrder(
  orderId: string,
  items: OrderInventoryLine[],
  adminId?: string
): Promise<void> {
  const db = getAdminFirestore();
  const orderRef = db.collection(ORDERS).doc(orderId);

  await db.runTransaction(async (tx) => {
    const orderDoc = await tx.get(orderRef);
    if (!orderDoc.exists) {
      throw new Error("Order not found");
    }

    const orderData = orderDoc.data()!;
    const currentStatus = (orderData.inventoryStatus ??
      "none") as OrderInventoryStatus;

    if (currentStatus !== "fulfilled") {
      return;
    }

    const parentItems = items.filter((item) => !item.variantId);
    const variantItems = items.filter((item) => item.variantId);
    const productDocs = await loadProductDocsInTransaction(
      tx,
      items.map((item) => item.productId)
    );
    const snapshots = new Map<string, ProductStockSnapshot>();
    for (const item of parentItems) {
      snapshots.set(
        item.productId,
        readSnapshot(item.productId, productDocs.get(item.productId)!)
      );
    }
    const now = new Date().toISOString();

    for (const item of parentItems) {
      const snap = snapshots.get(item.productId)!;
      const previousStock = snap.stock;
      const newStock = previousStock + item.quantity;

      tx.update(productRef(item.productId), {
        stock: newStock,
        stockQuantity: newStock,
        availability: stockToAvailability(newStock, snap.reservedStock),
        updatedAt: now,
      });

      writeLogInTransaction(tx, {
        productId: item.productId,
        sku: snap.sku,
        orderId,
        previousStock,
        newStock,
        quantityChanged: item.quantity,
        action: "order_cancelled",
        adminId: adminId ?? null,
        timestamp: now,
        previousReserved: snap.reservedStock,
        newReserved: snap.reservedStock,
      });
    }

    await fulfillVariantStockInTransaction(
      tx,
      orderId,
      variantItems,
      productDocs,
      "order_cancelled",
      now,
      adminId
    );

    tx.update(orderRef, {
      inventoryStatus: "released",
      updatedAt: now,
    });
  });

  invalidateCatalogCache();
}

export async function setProductStock(
  productId: string,
  newStock: number,
  options: {
    action: InventoryLogAction;
    orderId?: string;
    adminId?: string;
    note?: string;
  }
): Promise<InventoryLog> {
  const db = getAdminFirestore();
  const ref = productRef(productId);
  let log!: InventoryLog;

  await db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    if (!doc.exists) {
      throw new Error("Product not found");
    }

    const snap = readSnapshot(productId, doc.data()!);
    const now = new Date().toISOString();
    const quantityChanged = newStock - snap.stock;

    tx.update(ref, {
      stock: newStock,
      stockQuantity: newStock,
      availability: stockToAvailability(newStock, snap.reservedStock),
      updatedAt: now,
    });

    log = {
      id: createLogId(),
      productId,
      sku: snap.sku,
      orderId: options.orderId ?? null,
      previousStock: snap.stock,
      newStock,
      quantityChanged,
      action: options.action,
      adminId: options.adminId ?? null,
      timestamp: now,
      note: options.note,
      previousReserved: snap.reservedStock,
      newReserved: snap.reservedStock,
    };

    writeLogInTransaction(tx, log);
  });

  invalidateCatalogCache();
  return log;
}

export async function listInventoryLogs(limit = 50): Promise<InventoryLog[]> {
  const snap = await getAdminFirestore()
    .collection(INVENTORY_LOGS)
    .orderBy("timestamp", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((doc) => doc.data() as InventoryLog);
}

export async function recordInventoryLogEntry(
  entry: Omit<InventoryLog, "id">
): Promise<InventoryLog> {
  const id = createLogId();
  const log: InventoryLog = { ...entry, id };
  await getAdminFirestore().collection(INVENTORY_LOGS).doc(id).set(log);
  return log;
}

export { getAvailableStock };
