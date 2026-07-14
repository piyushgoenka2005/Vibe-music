import "server-only";

import { getProductById } from "@/services/catalogService";
import { loadProducts } from "@/lib/server/catalogRepository";
import { getVariantFromProduct } from "@/lib/server/variantService";
import {
  getDefaultGstRateForCategory,
  type GSTRate,
} from "@/lib/gstCalculator";
import { resolvePositiveUnitPrice } from "@/lib/pricing/unitPrice";

export interface CartRepriceLineInput {
  productId: string;
  variantId?: string;
  quantity: number;
  name?: string;
}

export interface CartRepriceLineResult {
  productId: string;
  variantId?: string;
  variantSku?: string;
  variantLabel?: string;
  name: string;
  quantity: number;
  price: number;
  gstRate: GSTRate;
  image?: string;
  brand?: string;
  slug?: string;
  error?: string;
}

/**
 * Reprice cart lines from the same catalog source used by order creation.
 * Does not throw on bad lines — returns per-line errors instead.
 */
export async function repriceCartLines(
  items: CartRepriceLineInput[]
): Promise<CartRepriceLineResult[]> {
  const localProducts = loadProducts();
  const localById = new Map(localProducts.map((product) => [product.id, product]));

  return Promise.all(
    items.map(async (item) => {
      let product = localById.get(item.productId) ?? null;
      if (!product) {
        product = (await getProductById(item.productId)) ?? null;
      }

      if (!product || product.status !== "active") {
        return {
          productId: item.productId,
          variantId: item.variantId,
          name: item.name ?? "Unknown product",
          quantity: item.quantity,
          price: 0,
          gstRate: 18 as GSTRate,
          error: "Product unavailable",
        };
      }

      const variant = getVariantFromProduct(product, item.variantId);
      if (item.variantId && !variant) {
        return {
          productId: item.productId,
          variantId: item.variantId,
          name: product.name,
          quantity: item.quantity,
          price: 0,
          gstRate: (product.gstRate ??
            getDefaultGstRateForCategory(product.category)) as GSTRate,
          error: "Variant unavailable",
        };
      }

      const unitPrice = resolvePositiveUnitPrice(product.price, variant?.price);
      if (unitPrice == null) {
        return {
          productId: item.productId,
          variantId: variant?.id,
          name: product.name,
          quantity: item.quantity,
          price: 0,
          gstRate: (product.gstRate ??
            getDefaultGstRateForCategory(product.category)) as GSTRate,
          error: "Coming Soon",
        };
      }

      return {
        productId: item.productId,
        variantId: variant?.id,
        variantSku: variant?.sku,
        variantLabel: variant?.label,
        name: variant?.label ? `${product.name} — ${variant.label}` : product.name,
        quantity: item.quantity,
        price: unitPrice,
        gstRate: (product.gstRate ??
          getDefaultGstRateForCategory(product.category)) as GSTRate,
        image: variant?.images?.[0] || product.images?.[0],
        brand: product.brand,
        slug: product.slug,
      };
    })
  );
}
