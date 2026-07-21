import "server-only";

import { prisma } from "@/lib/db/prisma";
import { asJsonValue } from "@/lib/server/prisma/mappers";
import { invalidateCatalogCache } from "@/lib/server/storeCatalogRepository";
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

export { getAvailableStock };

type ProductRow = {
  id: string;
  name: string;
  sku: string;
  stock: number;
  stockQuantity: number | null;
  reservedStock: number | null;
  lowStockThreshold: number | null;
  status: string;
  availability: string;
  detail: unknown;
};

function readSnapshot(productId: string, row: ProductRow): ProductStockSnapshot {
  const stock = Number(row.stock ?? row.stockQuantity ?? 0);
  const reservedStock = Number(row.reservedStock ?? 0);
  return {
    productId,
    sku: row.sku,
    name: row.name,
    stock,
    reservedStock,
    lowStockThreshold: Number(row.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD),
    status: row.status,
  };
}

function createLogId(): string {
  return `inv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function readVariantStock(row: ProductRow, variantId: string): number | null {
  const detail = row.detail as { variants?: Array<{ id: string; stock?: number }> } | null;
  const variants = detail?.variants;
  if (!Array.isArray(variants)) return null;
  const variant = variants.find((entry) => entry.id === variantId);
  if (!variant) return null;

  if (variant.stock !== undefined && variant.stock !== null) {
    return Number(variant.stock);
  }

  const parentStock = Number(row.stock ?? row.stockQuantity ?? 0);
  const reservedStock = Number(row.reservedStock ?? 0);
  return getAvailableStock(parentStock, reservedStock);
}

function buildVariantStockPatch(
  row: ProductRow,
  variantId: string,
  delta: number
): Record<string, unknown> {
  const detail = (row.detail as Record<string, unknown> | null) ?? {};
  const variants = Array.isArray((detail as { variants?: unknown }).variants)
    ? [...((detail as { variants: Array<Record<string, unknown>> }).variants)]
    : [];
  const index = variants.findIndex((entry) => entry.id === variantId);
  if (index < 0) {
    throw new Error(`Variant not found: ${variantId}`);
  }

  const currentStock =
    variants[index]!.stock !== undefined && variants[index]!.stock !== null
      ? Number(variants[index]!.stock)
      : (readVariantStock(row, variantId) ?? 0);
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
  const reservedStock = Number(row.reservedStock ?? 0);
  const now = new Date().toISOString();

  return {
    detail: { ...detail, variants },
    stock: parentStock,
    stockQuantity: parentStock,
    availability: stockToAvailability(parentStock, reservedStock),
    updatedAt: now,
  };
}

async function writeInventoryLog(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  log: Omit<InventoryLog, "id"> & { id?: string }
): Promise<void> {
  const id = log.id ?? createLogId();
  await tx.inventoryLog.create({
    data: {
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
    },
  });
}

async function loadProductRows(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  productIds: string[]
): Promise<Map<string, ProductRow>> {
  const uniqueIds = [...new Set(productIds)];
  const rows = await tx.product.findMany({ where: { id: { in: uniqueIds } } });
  const map = new Map<string, ProductRow>();
  for (const row of rows) {
    map.set(row.id, row);
  }
  for (const productId of uniqueIds) {
    if (!map.has(productId)) {
      throw new Error(`Product not found: ${productId}`);
    }
  }
  return map;
}

async function applyVariantStockChanges(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  orderId: string,
  items: OrderInventoryLine[],
  productRows: Map<string, ProductRow>,
  deltaForItem: (item: OrderInventoryLine) => number,
  action: InventoryLogAction,
  now: string,
  adminId?: string | null
): Promise<void> {
  const byProduct = new Map<string, OrderInventoryLine[]>();
  for (const item of items) {
    if (!item.variantId) continue;
    const list = byProduct.get(item.productId) ?? [];
    list.push(item);
    byProduct.set(item.productId, list);
  }

  for (const [productId, productItems] of byProduct) {
    let row = { ...productRows.get(productId)! };
    for (const item of productItems) {
      if (!item.variantId) continue;
      const previousStock = readVariantStock(row, item.variantId) ?? 0;
      const delta = deltaForItem(item);
      const patch = buildVariantStockPatch(row, item.variantId, delta);
      row = { ...row, ...patch, detail: patch.detail } as ProductRow;
      productRows.set(productId, row);
      await tx.product.update({
        where: { id: productId },
        data: {
          detail: asJsonValue(patch.detail),
          stock: Number(patch.stock),
          stockQuantity: Number(patch.stockQuantity),
          availability: String(patch.availability),
          updatedAt: String(patch.updatedAt),
        },
      });
      await writeInventoryLog(tx, {
        productId,
        sku: item.variantId,
        orderId,
        previousStock,
        newStock: previousStock + delta,
        quantityChanged: delta,
        action,
        adminId: adminId ?? null,
        timestamp: now,
      });
    }
  }
}

export async function fetchProductStockSnapshots(
  productIds: string[]
): Promise<Map<string, ProductStockSnapshot>> {
  const uniqueIds = [...new Set(productIds.filter(Boolean))];
  const map = new Map<string, ProductStockSnapshot>();
  if (uniqueIds.length === 0) return map;

  const rows = await prisma.product.findMany({ where: { id: { in: uniqueIds } } });
  rows.forEach((row) => {
    map.set(row.id, readSnapshot(row.id, row));
  });
  return map;
}

export async function validateStockAvailability(
  items: OrderInventoryLine[]
): Promise<void> {
  const variantErrors: string[] = [];
  const parentItems: OrderInventoryLine[] = [];
  const variantItems: OrderInventoryLine[] = [];

  for (const item of items) {
    if (!item.variantId) {
      parentItems.push(item);
      continue;
    }
    variantItems.push(item);
  }

  if (variantItems.length > 0) {
    const variantProductIds = [...new Set(variantItems.map((item) => item.productId))];
    const rows = await prisma.product.findMany({
      where: { id: { in: variantProductIds } },
    });
    const rowMap = new Map(rows.map((row) => [row.id, row]));

    for (const item of variantItems) {
      const row = rowMap.get(item.productId);
      if (!row) {
        variantErrors.push(`${item.name ?? item.productId}: product not found`);
        continue;
      }

      const available = readVariantStock(row, item.variantId!);
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
      .map((e) => `${e.name}: requested ${e.quantity}, available ${e.available}`)
      .join("; ");
    throw new Error(`Insufficient stock: ${detail}`);
  }
}

export async function reserveStockForOrder(
  orderId: string,
  items: OrderInventoryLine[]
): Promise<void> {
  const parentItems = items.filter((item) => !item.variantId);
  const variantItems = items.filter((item) => item.variantId);

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");

    const currentStatus = (order.inventoryStatus ?? "none") as OrderInventoryStatus;
    if (currentStatus === "reserved" || currentStatus === "fulfilled") {
      return;
    }

    const productRows = await loadProductRows(
      tx,
      items.map((item) => item.productId)
    );

    if (parentItems.length > 0) {
      const snapshots = new Map<string, ProductStockSnapshot>();
      for (const item of parentItems) {
        snapshots.set(item.productId, readSnapshot(item.productId, productRows.get(item.productId)!));
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
          .map((e) => `${e.name}: requested ${e.quantity}, available ${e.available}`)
          .join("; ");
        throw new Error(`Insufficient stock: ${detail}`);
      }
    }

    for (const item of variantItems) {
      const row = productRows.get(item.productId)!;
      const available = readVariantStock(row, item.variantId!) ?? 0;
      if (item.quantity > available) {
        throw new Error(
          `Insufficient variant stock for ${item.name ?? item.variantId}: requested ${item.quantity}, available ${available}`
        );
      }
    }

    const now = new Date().toISOString();

    for (const item of parentItems) {
      const snapshot = readSnapshot(item.productId, productRows.get(item.productId)!);
      const previousReserved = snapshot.reservedStock;
      const newReserved = previousReserved + item.quantity;

      await tx.product.update({
        where: { id: item.productId },
        data: { reservedStock: newReserved, updatedAt: now },
      });

      await writeInventoryLog(tx, {
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

    await applyVariantStockChanges(
      tx,
      orderId,
      variantItems,
      productRows,
      (item) => -item.quantity,
      "order_created",
      now
    );

    await tx.order.update({
      where: { id: orderId },
      data: { inventoryStatus: "reserved", updatedAt: now },
    });
  });

  invalidateCatalogCache();
}

export async function fulfillReservedStockForOrder(
  orderId: string,
  items: OrderInventoryLine[]
): Promise<void> {
  const parentItems = items.filter((item) => !item.variantId);
  const variantItems = items.filter((item) => item.variantId);

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");

    const currentStatus = (order.inventoryStatus ?? "none") as OrderInventoryStatus;
    if (currentStatus === "fulfilled") return;
    if (currentStatus !== "reserved") {
      throw new Error(`Cannot fulfill inventory for order in status: ${currentStatus}`);
    }

    const productRows = await loadProductRows(
      tx,
      items.map((item) => item.productId)
    );
    const now = new Date().toISOString();
    const variantInventoryHeld = variantItems.length > 0;

    for (const item of parentItems) {
      const snap = readSnapshot(item.productId, productRows.get(item.productId)!);
      const previousStock = snap.stock;
      const previousReserved = snap.reservedStock;
      const newStock = previousStock - item.quantity;
      const newReserved = previousReserved - item.quantity;

      if (newStock < 0 || newReserved < 0) {
        throw new Error(`Invalid stock state for product ${item.productId}`);
      }

      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: newStock,
          stockQuantity: newStock,
          reservedStock: newReserved,
          availability: stockToAvailability(newStock, newReserved),
          updatedAt: now,
        },
      });

      await writeInventoryLog(tx, {
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
      await applyVariantStockChanges(
        tx,
        orderId,
        variantItems,
        productRows,
        (item) => -item.quantity,
        "order_paid",
        now
      );
    }

    await tx.order.update({
      where: { id: orderId },
      data: { inventoryStatus: "fulfilled", updatedAt: now },
    });
  });

  invalidateCatalogCache();
}

export async function reserveAndFulfillStockForOrder(
  orderId: string,
  items: OrderInventoryLine[]
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");

    const currentStatus = (order.inventoryStatus ?? "none") as OrderInventoryStatus;
    if (currentStatus === "fulfilled") return;

    const productRows = await loadProductRows(
      tx,
      items.map((item) => item.productId)
    );
    const snapshots = new Map<string, ProductStockSnapshot>();
    for (const [productId, row] of productRows) {
      snapshots.set(productId, readSnapshot(productId, row));
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
        .map((e) => `${e.name}: requested ${e.quantity}, available ${e.available}`)
        .join("; ");
      throw new Error(`Insufficient stock: ${detail}`);
    }

    for (const item of variantItems) {
      const row = productRows.get(item.productId)!;
      const available = readVariantStock(row, item.variantId!) ?? 0;
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

      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: newStock,
          stockQuantity: newStock,
          availability: stockToAvailability(newStock, snap.reservedStock),
          updatedAt: now,
        },
      });

      await writeInventoryLog(tx, {
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

    await applyVariantStockChanges(
      tx,
      orderId,
      variantItems,
      productRows,
      (item) => -item.quantity,
      "order_paid",
      now
    );

    await tx.order.update({
      where: { id: orderId },
      data: { inventoryStatus: "fulfilled", updatedAt: now },
    });
  });

  invalidateCatalogCache();
}

export async function releaseReservedStockForOrder(
  orderId: string,
  items: OrderInventoryLine[]
): Promise<void> {
  const parentItems = items.filter((item) => !item.variantId);
  const variantItems = items.filter((item) => item.variantId);

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");

    const currentStatus = (order.inventoryStatus ?? "none") as OrderInventoryStatus;
    if (currentStatus === "released" || currentStatus === "fulfilled") return;
    if (currentStatus !== "reserved") return;

    const productRows = await loadProductRows(
      tx,
      items.map((item) => item.productId)
    );
    const now = new Date().toISOString();
    const variantInventoryHeld = variantItems.length > 0;

    for (const item of parentItems) {
      const snap = readSnapshot(item.productId, productRows.get(item.productId)!);
      const previousReserved = snap.reservedStock;
      const newReserved = Math.max(0, previousReserved - item.quantity);

      await tx.product.update({
        where: { id: item.productId },
        data: {
          reservedStock: newReserved,
          availability: stockToAvailability(snap.stock, newReserved),
          updatedAt: now,
        },
      });

      await writeInventoryLog(tx, {
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
      await applyVariantStockChanges(
        tx,
        orderId,
        variantItems,
        productRows,
        (item) => item.quantity,
        "order_cancelled",
        now
      );
    }

    await tx.order.update({
      where: { id: orderId },
      data: { inventoryStatus: "released", updatedAt: now },
    });
  });

  invalidateCatalogCache();
}

export async function restoreStockForCancelledOrder(
  orderId: string,
  items: OrderInventoryLine[],
  adminId?: string
): Promise<void> {
  const parentItems = items.filter((item) => !item.variantId);
  const variantItems = items.filter((item) => item.variantId);

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");

    const currentStatus = (order.inventoryStatus ?? "none") as OrderInventoryStatus;
    if (currentStatus !== "fulfilled") return;

    const productRows = await loadProductRows(
      tx,
      items.map((item) => item.productId)
    );
    const now = new Date().toISOString();

    for (const item of parentItems) {
      const snap = readSnapshot(item.productId, productRows.get(item.productId)!);
      const previousStock = snap.stock;
      const newStock = previousStock + item.quantity;

      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: newStock,
          stockQuantity: newStock,
          availability: stockToAvailability(newStock, snap.reservedStock),
          updatedAt: now,
        },
      });

      await writeInventoryLog(tx, {
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

    await applyVariantStockChanges(
      tx,
      orderId,
      variantItems,
      productRows,
      (item) => item.quantity,
      "order_cancelled",
      now,
      adminId
    );

    await tx.order.update({
      where: { id: orderId },
      data: { inventoryStatus: "released", updatedAt: now },
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
  let log!: InventoryLog;

  await prisma.$transaction(async (tx) => {
    const row = await tx.product.findUnique({ where: { id: productId } });
    if (!row) throw new Error("Product not found");

    const snap = readSnapshot(productId, row);
    const now = new Date().toISOString();
    const quantityChanged = newStock - snap.stock;

    await tx.product.update({
      where: { id: productId },
      data: {
        stock: newStock,
        stockQuantity: newStock,
        availability: stockToAvailability(newStock, snap.reservedStock),
        updatedAt: now,
      },
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

    await writeInventoryLog(tx, log);
  });

  invalidateCatalogCache();
  return log;
}

export async function listInventoryLogs(limit = 50): Promise<InventoryLog[]> {
  const rows = await prisma.inventoryLog.findMany({
    orderBy: { timestamp: "desc" },
    take: limit,
  });

  return rows.map((row) => ({
    id: row.id,
    productId: row.productId,
    sku: row.sku,
    orderId: row.orderId,
    previousStock: row.previousStock,
    newStock: row.newStock,
    quantityChanged: row.quantityChanged,
    action: row.action as InventoryLogAction,
    adminId: row.adminId,
    timestamp: row.timestamp,
    previousReserved: row.previousReserved ?? undefined,
    newReserved: row.newReserved ?? undefined,
    note: row.note ?? undefined,
  }));
}

export async function recordInventoryLogEntry(
  entry: Omit<InventoryLog, "id">
): Promise<InventoryLog> {
  const log: InventoryLog = { ...entry, id: createLogId() };
  await prisma.inventoryLog.create({
    data: {
      id: log.id,
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
    },
  });
  return log;
}
