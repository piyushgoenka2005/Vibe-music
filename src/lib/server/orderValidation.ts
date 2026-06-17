import { getProductById } from "@/services/catalogService";
import { getVariantFromProduct } from "@/lib/server/variantService";
import {
  getDefaultGstRateForCategory,
  type GSTRate,
} from "@/lib/gstCalculator";
import { getAvailableStock } from "@/lib/inventory/stockMath";
import {
  isFirestoreUnavailableError,
  logFirestoreWarning,
} from "@/lib/server/firestoreErrors";
import { validateCoupon } from "@/lib/server/couponService";
import { validateStockAvailability } from "@/lib/server/inventoryService";
import type { CreateOrderPayload } from "@/types/order";

async function validateStockAvailabilityFromCatalog(
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    name: string;
  }>
): Promise<void> {
  const errors: string[] = [];

  for (const item of items) {
    const product = await getProductById(item.productId);
    if (!product || product.status !== "active") {
      errors.push(`${item.name}: product unavailable`);
      continue;
    }

    const variant = getVariantFromProduct(product, item.variantId);
    if (item.variantId && !variant) {
      errors.push(`${item.name}: variant unavailable`);
      continue;
    }

    const parentAvailable = getAvailableStock(
      product.stock,
      product.reservedStock ?? 0
    );
    const available =
      variant && item.variantId
        ? getAvailableStock(
            variant.stock ?? product.stock,
            product.reservedStock ?? 0
          )
        : parentAvailable;

    if (item.quantity > available) {
      errors.push(
        `${item.name}: requested ${item.quantity}, available ${available}`
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(`Insufficient stock: ${errors.join("; ")}`);
  }
}

async function validateStockAvailabilityWithFallback(
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    name: string;
  }>
): Promise<void> {
  try {
    await validateStockAvailability(items);
  } catch (error) {
    if (isFirestoreUnavailableError(error)) {
      logFirestoreWarning(
        "inventory",
        error,
        "Firestore unavailable — validating stock from catalog"
      );
      await validateStockAvailabilityFromCatalog(items);
      return;
    }
    throw error;
  }
}

export async function resolveOrderItemsFromFirestore(
  items: CreateOrderPayload["items"]
): Promise<CreateOrderPayload["items"]> {
  const resolved = await Promise.all(
    items.map(async (item) => {
      const product = await getProductById(item.productId);
      if (!product || product.status !== "active") {
        throw new Error(
          `Product "${item.name}" is unavailable or no longer active`
        );
      }

      const variant = getVariantFromProduct(product, item.variantId);
      if (item.variantId && !variant) {
        throw new Error(`Selected variant for "${product.name}" is no longer available`);
      }

      const unitPrice = variant?.price ?? product.price;
      const salePrice =
        product.originalPrice > unitPrice ? unitPrice : unitPrice;

      return {
        productId: item.productId,
        variantId: variant?.id,
        variantSku: variant?.sku ?? item.variantSku,
        variantLabel: variant?.label ?? item.variantLabel,
        name: variant?.label ? `${product.name} — ${variant.label}` : product.name,
        quantity: item.quantity,
        price: salePrice,
        gstRate: (product.gstRate ??
          item.gstRate ??
          getDefaultGstRateForCategory(product.category)) as GSTRate,
      };
    })
  );

  await validateStockAvailabilityWithFallback(
    resolved.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      name: item.name,
    }))
  );

  return resolved;
}

export async function resolveCouponDiscount(
  couponCode: string | null | undefined,
  subtotal: number
): Promise<number> {
  if (!couponCode) return 0;
  const result = await validateCoupon(couponCode, subtotal);
  return result.valid ? result.discount : 0;
}
