import { DEFAULT_LOW_STOCK_THRESHOLD } from "@/types/inventory";

export function getAvailableStock(stock: number, reservedStock: number): number {
  return Math.max(0, stock - reservedStock);
}

export function isLowStock(
  stock: number,
  reservedStock: number,
  threshold: number = DEFAULT_LOW_STOCK_THRESHOLD
): boolean {
  const available = getAvailableStock(stock, reservedStock);
  return available > 0 && available <= threshold;
}

export function isOutOfStock(stock: number, reservedStock: number): boolean {
  return getAvailableStock(stock, reservedStock) <= 0;
}

export interface StockValidationItem {
  productId: string;
  name: string;
  quantity: number;
  available: number;
}

export function validateAvailability(
  items: Array<{ productId: string; name: string; quantity: number }>,
  snapshots: Map<
    string,
    { name: string; stock: number; reservedStock: number; status: string }
  >
): StockValidationItem[] {
  const errors: StockValidationItem[] = [];

  for (const item of items) {
    const snap = snapshots.get(item.productId);
    if (!snap) {
      errors.push({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        available: 0,
      });
      continue;
    }
    if (snap.status !== "active") {
      errors.push({
        productId: item.productId,
        name: snap.name,
        quantity: item.quantity,
        available: 0,
      });
      continue;
    }
    const available = getAvailableStock(snap.stock, snap.reservedStock);
    if (item.quantity > available) {
      errors.push({
        productId: item.productId,
        name: snap.name,
        quantity: item.quantity,
        available,
      });
    }
  }

  return errors;
}

export function stockToAvailability(
  stock: number,
  reservedStock: number
): "in-stock" | "out-of-stock" | "limited" {
  const available = getAvailableStock(stock, reservedStock);
  if (available <= 0) return "out-of-stock";
  if (available <= 5) return "limited";
  return "in-stock";
}
