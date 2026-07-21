import "server-only";

import { fetchAllProducts } from "@/lib/server/storeCatalogRepository";
import {
  generateVariantSku,
  normalizeVariant,
  normalizeVariants,
  stockToVariantAvailability,
  syncProductAggregatesFromVariants,
} from "@/lib/variants";
import type { CatalogProduct } from "@/types/catalog";
import type { ProductVariant, VariantAttribute } from "@/types/product";

export async function fetchAllVariantSkus(
  excludeProductId?: string
): Promise<Set<string>> {
  const products = await fetchAllProducts(true);
  const skus = new Set<string>();

  for (const product of products) {
    if (excludeProductId && product.id === excludeProductId) continue;
    if (product.sku) skus.add(product.sku);
    for (const variant of product.detail?.variants ?? []) {
      if (variant.sku) skus.add(variant.sku);
    }
  }

  return skus;
}

export function getVariantsFromProduct(product: CatalogProduct): ProductVariant[] {
  const variants = product.detail?.variants ?? [];
  return normalizeVariants(
    variants.map((variant) => ({
      ...variant,
      stock: variant.stock ?? product.stock,
      attributes: variant.attributes ?? [],
      images: variant.images ?? [],
    })),
    product.sku,
    product.price,
    product.stock
  );
}

export function getVariantFromProduct(
  product: CatalogProduct,
  variantId?: string | null
): ProductVariant | null {
  const variants = getVariantsFromProduct(product);
  if (!variantId) {
    return variants.find((variant) => variant.isDefault) ?? variants[0] ?? null;
  }
  return variants.find((variant) => variant.id === variantId) ?? null;
}

export function applyVariantsToProduct(
  product: CatalogProduct,
  variantsInput: Array<{
    id?: string;
    label?: string;
    sku?: string;
    price?: number;
    stock?: number;
    attributes?: VariantAttribute[];
    images?: string[];
    isDefault?: boolean;
  }>,
  existingSkus: Set<string>
): CatalogProduct {
  const variants = variantsInput.map((variant, index) =>
    normalizeVariant(
      {
        ...variant,
        sku:
          variant.sku ||
          generateVariantSku(
            product.sku,
            variant.attributes ?? [],
            existingSkus
          ),
        isDefault: variant.isDefault ?? index === 0,
      },
      product.sku,
      product.price,
      product.stock,
      existingSkus
    )
  );

  const normalized = normalizeVariants(variants, product.sku, product.price, product.stock);
  const aggregates = syncProductAggregatesFromVariants(normalized);
  const detail = {
    ...(product.detail ?? {
      msrp: null,
      salePrice: null,
      specs: [],
      inTheBox: [],
      gallery: [],
      videos: [],
      reviews: [],
      qa: [],
      frequentlyBoughtTogether: [],
      similarProductIds: [],
      relatedProductIds: [],
    }),
    variants: normalized,
  };

  return {
    ...product,
    price: aggregates.price,
    stock: aggregates.stock,
    availability: aggregates.availability,
    detail,
  };
}

export function updateVariantStockInProduct(
  product: CatalogProduct,
  variantId: string,
  delta: number
): CatalogProduct {
  const variants = getVariantsFromProduct(product).map((variant) => {
    if (variant.id !== variantId) return variant;
    const stock = Math.max(0, variant.stock + delta);
    return {
      ...variant,
      stock,
      availability: stockToVariantAvailability(stock),
    };
  });

  const aggregates = syncProductAggregatesFromVariants(variants);
  return {
    ...product,
    stock: aggregates.stock,
    availability: aggregates.availability,
    detail: {
      ...(product.detail ?? {
        msrp: null,
        salePrice: null,
        specs: [],
        inTheBox: [],
        gallery: [],
        videos: [],
        reviews: [],
        qa: [],
        frequentlyBoughtTogether: [],
        similarProductIds: [],
        relatedProductIds: [],
      }),
      variants,
    },
  };
}
