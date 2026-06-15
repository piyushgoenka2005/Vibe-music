import {
  fetchProductStockSnapshots,
  getAvailableStock,
  listInventoryLogs,
  recordInventoryLogEntry,
  releaseReservedStockForOrder,
  restoreStockForCancelledOrder,
  setProductStock,
  validateStockAvailability,
} from "@/lib/server/inventoryRepository";
import { getAllProducts, getProductById } from "@/services/catalogService";
import {
  getAvailableStock as calcAvailable,
  isLowStock,
  isOutOfStock,
} from "@/lib/inventory/stockMath";
import type { InventoryAdjustment, InventoryRecord } from "@/types/admin";
import type { InventoryLog, OrderInventoryLine } from "@/types/inventory";
import { DEFAULT_LOW_STOCK_THRESHOLD } from "@/types/inventory";
import type { Order } from "@/types/order";

export {
  fulfillReservedStockForOrder,
  releaseReservedStockForOrder,
  reserveAndFulfillStockForOrder,
  reserveStockForOrder,
  validateStockAvailability,
} from "@/lib/server/inventoryRepository";

function orderToInventoryLines(order: Order): OrderInventoryLine[] {
  return order.items.map((item) => ({
    productId: item.productId,
    variantId: item.variantId,
    quantity: item.quantity,
    name: item.name,
  }));
}

export async function listInventory(): Promise<InventoryRecord[]> {
  const products = await getAllProducts(true);

  return products
    .map((product) => {
      const reservedStock = product.reservedStock ?? 0;
      const threshold = product.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
      const available = calcAvailable(product.stock, reservedStock);

      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        stockQuantity: product.stock,
        reservedQuantity: reservedStock,
        availableQuantity: available,
        lowStockThreshold: threshold,
        lastAdjustedAt: product.updatedAt,
      };
    })
    .sort((a, b) => a.availableQuantity - b.availableQuantity);
}

export async function adjustStock(
  productId: string,
  newQuantity: number,
  reason: string,
  adjustedBy: string
): Promise<InventoryAdjustment> {
  const product = await getProductById(productId);
  if (!product) throw new Error("Product not found");

  const previousQuantity = product.stock;
  const log = await setProductStock(productId, newQuantity, {
    action: "manual_adjustment",
    adminId: adjustedBy,
    note: reason,
  });

  return {
    id: log.id,
    productId,
    productName: product.name,
    previousQuantity,
    newQuantity,
    delta: newQuantity - previousQuantity,
    reason,
    adjustedBy,
    createdAt: log.timestamp,
  };
}

export async function listAdjustments(limit = 50): Promise<InventoryLog[]> {
  return listInventoryLogs(limit);
}

export async function getInventoryStats() {
  const records = await listInventory();
  return {
    totalSkus: records.length,
    lowStock: records.filter((r) =>
      isLowStock(
        r.stockQuantity,
        r.reservedQuantity ?? 0,
        r.lowStockThreshold
      )
    ).length,
    outOfStock: records.filter((r) =>
      isOutOfStock(r.stockQuantity, r.reservedQuantity ?? 0)
    ).length,
    totalUnits: records.reduce((sum, r) => sum + r.stockQuantity, 0),
    totalAvailableUnits: records.reduce(
      (sum, r) => sum + (r.availableQuantity ?? r.stockQuantity),
      0
    ),
  };
}

export async function getLowStockProducts(limit = 10) {
  const products = await getAllProducts(true);
  return products
    .map((product) => {
      const reservedStock = product.reservedStock ?? 0;
      const threshold = product.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
      const available = calcAvailable(product.stock, reservedStock);
      return { product, reservedStock, threshold, available };
    })
    .filter(
      ({ available, threshold }) => available > 0 && available <= threshold
    )
    .sort((a, b) => a.available - b.available)
    .slice(0, limit)
    .map(({ product, threshold, available, reservedStock }) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      stockQuantity: product.stock,
      reservedQuantity: reservedStock,
      availableQuantity: available,
      lowStockThreshold: threshold,
      availability: product.availability,
    }));
}

export async function getOutOfStockProducts(limit = 10) {
  const products = await getAllProducts(true);
  return products
    .map((product) => {
      const reservedStock = product.reservedStock ?? 0;
      const available = calcAvailable(product.stock, reservedStock);
      return { product, reservedStock, available };
    })
    .filter(({ available }) => available <= 0)
    .slice(0, limit)
    .map(({ product, reservedStock, available }) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      stockQuantity: product.stock,
      reservedQuantity: reservedStock,
      availableQuantity: available,
      lowStockThreshold: product.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD,
      availability: "out-of-stock" as const,
    }));
}

export async function releaseOrderInventory(order: Order): Promise<void> {
  const lines = orderToInventoryLines(order);
  const status = order.inventoryStatus ?? "none";

  if (status === "reserved") {
    await releaseReservedStockForOrder(order.id, lines);
    return;
  }

  if (status === "fulfilled") {
    await restoreStockForCancelledOrder(order.id, lines);
  }
}

export async function logBulkImportStock(
  productId: string,
  sku: string,
  stock: number,
  adminId?: string
): Promise<void> {
  await recordInventoryLogEntry({
    productId,
    sku,
    orderId: null,
    previousStock: 0,
    newStock: stock,
    quantityChanged: stock,
    action: "bulk_import",
    adminId: adminId ?? null,
    timestamp: new Date().toISOString(),
    note: "Initial stock from bulk import",
  });
}

export async function checkProductsAvailability(
  items: OrderInventoryLine[]
): Promise<Map<string, number>> {
  const snapshots = await fetchProductStockSnapshots(
    items.map((item) => item.productId)
  );
  const map = new Map<string, number>();
  snapshots.forEach((snap, id) => {
    map.set(id, getAvailableStock(snap.stock, snap.reservedStock));
  });
  return map;
}
