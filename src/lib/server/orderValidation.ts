import { getProductsByIds } from "@/services/catalogService";
import { loadProducts } from "@/lib/server/catalogRepository";
import { getVariantFromProduct } from "@/lib/server/variantService";
import type { CatalogProduct } from "@/types/catalog";
import { getDefaultGstRateForCategory, type GSTRate } from "@/lib/gstCalculator";
import { getAvailableStock } from "@/lib/inventory/stockMath";
import { resolvePositiveUnitPrice } from "@/lib/pricing/unitPrice";
import { validateCoupon } from "@/lib/server/couponService";
import { validateStockAvailability } from "@/lib/server/inventoryService";
import type { CreateOrderRequestItem, ResolvedOrderItem } from "@/types/order";

function resolveCatalogGstRate(product: CatalogProduct): GSTRate {
  if (
    product.gstRate === 5 ||
    product.gstRate === 12 ||
    product.gstRate === 18 ||
    product.gstRate === 28
  ) {
    return product.gstRate;
  }
  return getDefaultGstRateForCategory(product.category);
}

type StockCheckLine = {
  productId: string;
  variantId?: string;
  quantity: number;
  name: string;
};

function validateStockFromLocalCatalog(
  items: StockCheckLine[],
  localProducts: CatalogProduct[],
): void {
  const byId = new Map(localProducts.map((product) => [product.id, product]));
  const errors: string[] = [];

  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product || product.status !== "active") {
      errors.push(`${item.name}: product unavailable`);
      continue;
    }

    const variant = getVariantFromProduct(product, item.variantId);
    if (item.variantId && !variant) {
      errors.push(`${item.name}: variant unavailable`);
      continue;
    }

    const parentAvailable = getAvailableStock(product.stock, product.reservedStock ?? 0);
    const available =
      variant && item.variantId
        ? getAvailableStock(variant.stock ?? product.stock, product.reservedStock ?? 0)
        : parentAvailable;

    if (item.quantity > available) {
      errors.push(`${item.name}: requested ${item.quantity}, available ${available}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Insufficient stock: ${errors.join("; ")}`);
  }
}

export async function resolveOrderItems(
  items: CreateOrderRequestItem[],
): Promise<ResolvedOrderItem[]> {
  const localProducts = loadProducts();
  const localById = new Map(localProducts.map((product) => [product.id, product]));

  // Single batched round-trip for lines missing from the local JSON catalog.
  const missingIds = [...new Set(items.map((item) => item.productId))].filter(
    (id) => !localById.has(id),
  );
  const dbProducts = missingIds.length > 0 ? await getProductsByIds(missingIds) : [];
  const dbById = new Map(dbProducts.map((product) => [product.id, product]));

  const resolved = items.map((item) => {
    const product = localById.get(item.productId) ?? dbById.get(item.productId) ?? null;

    if (!product || product.status !== "active") {
      const label = item.name?.trim() || item.productId;
      throw new Error(`Product "${label}" is unavailable or no longer active`);
    }

    const variant = getVariantFromProduct(product, item.variantId);
    if (item.variantId && !variant) {
      throw new Error(`Selected variant for "${product.name}" is no longer available`);
    }

    const unitPrice = resolvePositiveUnitPrice(product.price, variant?.price);
    if (unitPrice == null) {
      throw new Error(`"${product.name}" is not available for purchase yet (Coming Soon)`);
    }

    return {
      productId: item.productId,
      variantId: variant?.id,
      variantSku: variant?.sku ?? item.variantSku,
      variantLabel: variant?.label ?? item.variantLabel,
      name: variant?.label ? `${product.name} — ${variant.label}` : product.name,
      quantity: item.quantity,
      price: unitPrice,
      gstRate: resolveCatalogGstRate(product),
    };
  });

  const stockLines: StockCheckLine[] = resolved.map((item) => ({
    productId: item.productId,
    variantId: item.variantId,
    quantity: item.quantity,
    name: item.name,
  }));

  try {
    await validateStockAvailability(stockLines);
  } catch {
    validateStockFromLocalCatalog(stockLines, localProducts);
  }

  return resolved;
}

export async function resolveCouponDiscount(
  couponCode: string | null | undefined,
  subtotal: number,
): Promise<number> {
  if (!couponCode) return 0;
  const result = await validateCoupon(couponCode, subtotal);
  return result.valid ? result.discount : 0;
}
