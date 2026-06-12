import { getAllProducts, getProductById, updateProduct } from "@/services/catalogService";
import type { InventoryAdjustment, InventoryRecord } from "@/types/admin";

const LOW_STOCK_DEFAULT = 10;

export async function listInventory(): Promise<InventoryRecord[]> {
  return getAllProducts(true)
    .map((product) => ({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      stockQuantity: product.stock,
      lowStockThreshold: LOW_STOCK_DEFAULT,
      lastAdjustedAt: product.updatedAt,
    }))
    .sort((a, b) => a.stockQuantity - b.stockQuantity);
}

export async function adjustStock(
  productId: string,
  newQuantity: number,
  reason: string,
  adjustedBy: string
): Promise<InventoryAdjustment> {
  const product = getProductById(productId);
  if (!product) throw new Error("Product not found");

  const previousQuantity = product.stock;
  const now = new Date().toISOString();

  updateProduct(productId, { stock: newQuantity });

  return {
    id: `adj-${Date.now().toString(36)}`,
    productId,
    productName: product.name,
    previousQuantity,
    newQuantity,
    delta: newQuantity - previousQuantity,
    reason,
    adjustedBy,
    createdAt: now,
  };
}

export async function listAdjustments(limit = 50): Promise<InventoryAdjustment[]> {
  void limit;
  return [];
}

export async function getInventoryStats() {
  const records = await listInventory();
  return {
    totalSkus: records.length,
    lowStock: records.filter((r) => r.stockQuantity <= r.lowStockThreshold).length,
    outOfStock: records.filter((r) => r.stockQuantity <= 0).length,
    totalUnits: records.reduce((sum, r) => sum + r.stockQuantity, 0),
  };
}
