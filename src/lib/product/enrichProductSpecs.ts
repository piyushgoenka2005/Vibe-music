import { mergeProductSpecs } from "@/lib/product/productSpecs";
import { normalizeSpecLabel } from "@/lib/product/groupProductSpecs";
import type { ProductDetail, ProductSpec } from "@/types/product";

function formatCondition(condition: ProductDetail["condition"]): string {
  if (condition === "open-box") return "Open box";
  return condition.charAt(0).toUpperCase() + condition.slice(1);
}

function formatAvailability(availability: ProductDetail["availability"]): string {
  if (availability === "in-stock") return "In stock";
  if (availability === "out-of-stock") return "Out of stock";
  return "Limited stock";
}

function formatCurrency(amount: number | null | undefined): string | undefined {
  if (amount == null || !Number.isFinite(amount)) return undefined;
  return `₹${amount.toLocaleString("en-IN")}`;
}

/**
 * Enrich PDP specs with catalog metadata, variant attributes, and bulk-import
 * specifications so the product details panel stays dense even when detailSpecs
 * only contains a handful of rows.
 */
export function enrichProductSpecs(product: ProductDetail): ProductSpec[] {
  const map = new Map<string, ProductSpec>();

  for (const spec of mergeProductSpecs(product.specs, {})) {
    const value = String(spec.value ?? "").trim();
    if (!value) continue;
    map.set(normalizeSpecLabel(spec.label), { label: spec.label, value });
  }

  const metadataSpecs: Array<[string, string | undefined]> = [
    ["Brand", product.brand],
    ["Manufacturer", product.brand],
    ["SKU", product.sku],
    ["Category", product.category],
    ["Subcategory", product.subcategory],
    ["Product Category", product.category],
    ["Condition", formatCondition(product.condition)],
    ["Availability", formatAvailability(product.availability)],
    ["GST Rate", product.gstRate != null ? `${product.gstRate}%` : undefined],
    ["MRP", formatCurrency(product.msrp)],
    ["Selling Price", formatCurrency(product.salePrice ?? product.price)],
  ];

  for (const [label, value] of metadataSpecs) {
    const trimmed = value?.trim();
    if (!trimmed) continue;
    const key = normalizeSpecLabel(label);
    if (!map.has(key)) {
      map.set(key, { label, value: trimmed });
    }
  }

  const defaultVariant =
    product.variants.find((variant) => variant.isDefault) ?? product.variants[0];

  if (defaultVariant) {
    const variantEntries: Array<[string, string | undefined]> = [
      ["Variant", defaultVariant.label],
      ["Variant SKU", defaultVariant.sku],
    ];

    for (const attribute of defaultVariant.attributes) {
      const label = attribute.name?.trim() || attribute.type;
      const value = attribute.value?.trim();
      if (!label || !value) continue;
      variantEntries.push([label, value]);
    }

    for (const [label, value] of variantEntries) {
      const trimmed = value?.trim();
      if (!trimmed) continue;
      const key = normalizeSpecLabel(label);
      if (!map.has(key)) {
        map.set(key, { label, value: trimmed });
      }
    }
  }

  return Array.from(map.values());
}
