import type { ProductSpec } from "@/types/product";

export type ProductSpecGroupId =
  | "additional-details"
  | "keyboard-performance"
  | "connectivity"
  | "physical"
  | "item-details"
  | "guitar-specs"
  | "pricing-availability";

export interface ProductSpecGroup {
  id: ProductSpecGroupId;
  title: string;
  specs: ProductSpec[];
}

const QUICK_PREVIEW_LABELS = [
  "brand",
  "model name",
  "model number",
  "model no.",
  "style",
  "color",
  "connectivity",
  "connectivity technology",
  "power source",
  "number of keys",
  "instrument",
  "product type",
  "operating system",
  "ram memory installed size",
  "memory storage capacity",
  "cpu speed",
];

const ITEM_DETAIL_LABELS = new Set([
  "brand",
  "manufacturer",
  "model name",
  "model number",
  "model no.",
  "model year",
  "part number",
  "asin",
  "upc",
  "item type",
  "item type name",
  "product type",
  "product category",
  "subcategory",
  "category",
  "sku",
  "browse node",
  "warranty",
  "warranty description",
  "manufacturer contact",
  "importer contact",
  "packer contact",
  "unit count",
  "unit count type",
  "number of boxes",
  "dangerous goods",
  "box contents",
]);

const CONNECTIVITY_LABELS = new Set([
  "connectivity",
  "connectivity technology",
  "connector type",
  "headphones jack",
  "power source",
  "batteries required",
  "batteries included",
  "wireless provider",
  "cellular technology",
  "network connectivity technology",
  "wireless network technology",
]);

const KEYBOARD_PERFORMANCE_LABELS = new Set([
  "keys",
  "number of keys",
  "action",
  "keyboard action",
  "key action",
  "model",
  "model name",
  "model no.",
  "model number",
  "polyphony",
  "voices",
  "sounds",
  "effects",
  "instrument",
  "skill level",
  "variant",
  "variant sku",
  "sound engines",
  "special features",
]);

const PRICING_LABELS = new Set(["mrp", "selling price", "gst rate", "availability", "condition"]);

const PHYSICAL_LABELS = new Set([
  "size",
  "color",
  "finish type",
  "item weight",
  "item weight unit",
  "height top to bottom",
  "item height unit",
  "item depth front to back",
  "item depth unit",
  "item width side to side",
  "item width unit",
  "item package length",
  "package length unit",
  "item package width",
  "package width unit",
  "item package height",
  "package height unit",
  "package weight",
  "package weight unit",
  "skill level",
  "age range",
  "age range description",
  "instrument",
  "style",
  "screen size",
  "display type",
  "resolution",
  "refresh rate",
]);

const GUITAR_LABELS = new Set([
  "type",
  "body",
  "neck",
  "fingerboard",
  "fretboard",
  "scale length",
  "pickup",
  "pickups",
  "controls",
  "pickup selector",
  "bridge",
  "tuners & hardware",
  "tuners and hardware",
]);

const SIZE_FIT_LABELS = new Set(["size", "fit", "dimensions", "scale length"]);

const MATERIAL_CARE_LABELS = new Set([
  "material",
  "finish type",
  "finish",
  "care",
  "wash care",
  "body wood",
  "neck wood",
  "fingerboard material",
]);

export function normalizeSpecLabel(label: string): string {
  return label.toLowerCase().replace(/\s+/g, " ").trim();
}

function normalizeLabel(label: string): string {
  return normalizeSpecLabel(label);
}

function findSpec(specs: ProductSpec[], ...labels: string[]): ProductSpec | undefined {
  const wanted = new Set(labels.map(normalizeLabel));
  return specs.find((spec) => wanted.has(normalizeLabel(spec.label)));
}

export function getQuickPreviewSpecs(
  specs: ProductSpec[],
  brand?: string,
  limit = 8,
): ProductSpec[] {
  const used = new Set<string>();
  const preview: ProductSpec[] = [];

  if (brand?.trim()) {
    preview.push({ label: "Brand", value: brand.trim() });
    used.add("brand");
  }

  for (const wanted of QUICK_PREVIEW_LABELS) {
    if (preview.length >= limit) break;
    const spec = specs.find((entry) => normalizeLabel(entry.label) === wanted);
    if (!spec || used.has(normalizeLabel(spec.label))) continue;
    preview.push(spec);
    used.add(normalizeLabel(spec.label));
  }

  for (const spec of specs) {
    if (preview.length >= limit) break;
    const key = normalizeLabel(spec.label);
    if (used.has(key)) continue;
    // Keep the above-the-fold preview scannable — skip long keyword dumps.
    if (key === "keywords" || key === "search keywords" || key.startsWith("bullet")) {
      continue;
    }
    preview.push(spec);
    used.add(key);
  }

  return preview.slice(0, limit);
}

export function getSizeAndFitSpecs(specs: ProductSpec[]): ProductSpec[] {
  return specs.filter((spec) => SIZE_FIT_LABELS.has(normalizeLabel(spec.label)));
}

export function getMaterialAndCareSpecs(specs: ProductSpec[]): ProductSpec[] {
  return specs.filter((spec) => MATERIAL_CARE_LABELS.has(normalizeLabel(spec.label)));
}

export function getStyleSpec(specs: ProductSpec[]): ProductSpec | undefined {
  return findSpec(specs, "Style", "Style Name", "Model Year");
}

function classifySpec(label: string): ProductSpecGroupId {
  const normalized = normalizeLabel(label);

  if (GUITAR_LABELS.has(normalized)) return "guitar-specs";
  if (KEYBOARD_PERFORMANCE_LABELS.has(normalized)) return "keyboard-performance";
  if (PRICING_LABELS.has(normalized)) return "pricing-availability";
  if (ITEM_DETAIL_LABELS.has(normalized)) return "item-details";
  if (CONNECTIVITY_LABELS.has(normalized)) return "connectivity";
  if (PHYSICAL_LABELS.has(normalized)) return "physical";

  return "additional-details";
}

const GROUP_TITLES: Record<ProductSpecGroupId, string> = {
  "additional-details": "Additional details",
  "keyboard-performance": "Keyboard & performance",
  connectivity: "Connectivity",
  physical: "Dimensions & weight",
  "item-details": "Item details",
  "guitar-specs": "Instrument specs",
  "pricing-availability": "Pricing & availability",
};

/** Interleave groups so sparse accordions fill both grid columns evenly. */
export function balanceSpecGroups(groups: ProductSpecGroup[]): ProductSpecGroup[] {
  if (groups.length <= 2) return groups;

  const sorted = [...groups].sort((a, b) => b.specs.length - a.specs.length);
  const left: ProductSpecGroup[] = [];
  const right: ProductSpecGroup[] = [];
  let leftWeight = 0;
  let rightWeight = 0;

  for (const group of sorted) {
    const weight = group.specs.length;
    if (leftWeight <= rightWeight) {
      left.push(group);
      leftWeight += weight;
    } else {
      right.push(group);
      rightWeight += weight;
    }
  }

  const balanced: ProductSpecGroup[] = [];
  const maxLen = Math.max(left.length, right.length);
  for (let index = 0; index < maxLen; index += 1) {
    if (left[index]) balanced.push(left[index]!);
    if (right[index]) balanced.push(right[index]!);
  }
  return balanced;
}

export function groupProductSpecs(specs: ProductSpec[]): ProductSpecGroup[] {
  const buckets = new Map<ProductSpecGroupId, ProductSpec[]>();

  for (const spec of specs) {
    const value = String(spec.value ?? "").trim();
    if (!value) continue;

    const groupId = classifySpec(spec.label);
    const bucket = buckets.get(groupId) ?? [];
    bucket.push({ label: spec.label, value });
    buckets.set(groupId, bucket);
  }

  const order: ProductSpecGroupId[] = [
    "keyboard-performance",
    "guitar-specs",
    "additional-details",
    "physical",
    "connectivity",
    "pricing-availability",
    "item-details",
  ];

  const groups = order
    .map((id) => ({
      id,
      title: GROUP_TITLES[id],
      specs: buckets.get(id) ?? [],
    }))
    .filter((group) => group.specs.length > 0);

  return balanceSpecGroups(groups);
}
