import type { ProductAvailability, ProductVariant, VariantAttribute } from "@/types/product";

export type VariantAttributeType = VariantAttribute["type"];

export function stockToVariantAvailability(stock: number): ProductAvailability {
  if (stock <= 0) return "out-of-stock";
  if (stock <= 5) return "limited";
  return "in-stock";
}

export function buildVariantLabel(attributes: VariantAttribute[]): string {
  if (attributes.length === 0) return "Standard";
  return attributes.map((attr) => attr.value).join(" / ");
}

export function attributeKey(attr: VariantAttribute): string {
  return `${attr.type}:${attr.name}`;
}

export function variantAttributeSignature(attributes: VariantAttribute[]): string {
  return [...attributes]
    .sort((a, b) => attributeKey(a).localeCompare(attributeKey(b)))
    .map((attr) => `${attributeKey(attr)}=${attr.value}`)
    .join("|");
}

export function slugifyAttributeValue(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 8);
}

export function generateVariantSkuSuffix(attributes: VariantAttribute[]): string {
  if (attributes.length === 0) return "";
  return attributes.map((attr) => slugifyAttributeValue(attr.value)).filter(Boolean).join("-");
}

export function generateVariantSku(
  parentSku: string,
  attributes: VariantAttribute[],
  existingSkus: Set<string>
): string {
  const suffix = generateVariantSkuSuffix(attributes);
  const base = suffix ? `${parentSku}-${suffix}` : parentSku;
  if (!existingSkus.has(base)) return base.slice(0, 32);

  let index = 2;
  while (existingSkus.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`.slice(0, 32);
}

export function createVariantId(): string {
  return `var-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export interface LegacyVariantInput {
  id?: string;
  label?: string;
  sku?: string;
  price?: number;
  stock?: number;
  availability?: ProductAvailability;
  attributes?: VariantAttribute[];
  images?: string[];
  isDefault?: boolean;
}

export function normalizeVariant(
  input: LegacyVariantInput,
  parentSku: string,
  parentPrice: number,
  parentStock: number,
  existingSkus: Set<string>
): ProductVariant {
  const attributes =
    input.attributes ??
    (input.label && input.label !== "Standard"
      ? [{ type: "custom" as const, name: "Option", value: input.label }]
      : []);

  const stock =
    input.stock ??
    (input.availability === "out-of-stock"
      ? 0
      : input.availability === "limited"
        ? 3
        : parentStock);

  const sku =
    input.sku && input.sku.trim()
      ? input.sku.trim()
      : generateVariantSku(parentSku, attributes, existingSkus);

  existingSkus.add(sku);

  return {
    id: input.id ?? createVariantId(),
    label: input.label?.trim() || buildVariantLabel(attributes),
    sku,
    price: input.price ?? parentPrice,
    stock,
    availability: input.availability ?? stockToVariantAvailability(stock),
    attributes,
    images: input.images ?? [],
    isDefault: input.isDefault ?? false,
  };
}

export function normalizeVariants(
  variants: LegacyVariantInput[] | undefined,
  parentSku: string,
  parentPrice: number,
  parentStock: number
): ProductVariant[] {
  const existingSkus = new Set<string>();
  const normalized = (variants ?? []).map((variant) =>
    normalizeVariant(variant, parentSku, parentPrice, parentStock, existingSkus)
  );

  if (normalized.length === 0) {
    return [
      normalizeVariant(
        { id: "var-default", label: "Standard", isDefault: true },
        parentSku,
        parentPrice,
        parentStock,
        existingSkus
      ),
    ];
  }

  if (!normalized.some((variant) => variant.isDefault)) {
    normalized[0]!.isDefault = true;
  }

  return normalized.map((variant) => ({
    ...variant,
    availability: stockToVariantAvailability(variant.stock),
  }));
}

export function syncProductAggregatesFromVariants(
  variants: ProductVariant[]
): { price: number; stock: number; availability: ProductAvailability } {
  const activeVariants = variants.length > 0 ? variants : [];
  const stock = activeVariants.reduce((sum, variant) => sum + variant.stock, 0);
  const price = activeVariants.length
    ? Math.min(...activeVariants.map((variant) => variant.price))
    : 0;

  return {
    price,
    stock,
    availability: stockToVariantAvailability(stock),
  };
}

export function getDefaultVariant(variants: ProductVariant[]): ProductVariant {
  return variants.find((variant) => variant.isDefault) ?? variants[0]!;
}

export function findVariantById(
  variants: ProductVariant[],
  variantId?: string | null
): ProductVariant | null {
  if (!variantId) return null;
  return variants.find((variant) => variant.id === variantId) ?? null;
}

export interface VariantAttributeGroup {
  type: VariantAttributeType;
  name: string;
  values: string[];
}

export function getVariantAttributeGroups(
  variants: ProductVariant[]
): VariantAttributeGroup[] {
  const map = new Map<string, VariantAttributeGroup>();

  for (const variant of variants) {
    for (const attr of variant.attributes) {
      const key = attributeKey(attr);
      const group = map.get(key) ?? {
        type: attr.type,
        name: attr.name,
        values: [],
      };
      if (!group.values.includes(attr.value)) {
        group.values.push(attr.value);
      }
      map.set(key, group);
    }
  }

  return Array.from(map.values());
}

export function findVariantBySelection(
  variants: ProductVariant[],
  selection: Record<string, string>
): ProductVariant | null {
  const entries = Object.entries(selection).filter(([, value]) => value);
  if (entries.length === 0) return getDefaultVariant(variants);

  return (
    variants.find((variant) =>
      entries.every(([key, value]) =>
        variant.attributes.some(
          (attr) => attributeKey(attr) === key && attr.value === value
        )
      )
    ) ?? null
  );
}

export function getCartLineId(productId: string, variantId?: string): string {
  return variantId ? `${productId}::${variantId}` : productId;
}

export function parseCartLineId(lineId: string): {
  productId: string;
  variantId?: string;
} {
  const [productId, variantId] = lineId.split("::");
  return { productId: productId!, variantId };
}
