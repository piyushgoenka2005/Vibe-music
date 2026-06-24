import type { ProductSpec } from "@/types/product";

function normalizeLabel(label: string): string {
  return label.toLowerCase().replace(/\s+/g, " ").trim();
}

export function mergeProductSpecs(
  specs: ProductSpec[],
  specifications?: Record<string, string>
): ProductSpec[] {
  const map = new Map<string, ProductSpec>();

  for (const spec of specs) {
    const value = spec.value.trim();
    if (!value) continue;
    map.set(normalizeLabel(spec.label), { label: spec.label, value });
  }

  for (const [label, rawValue] of Object.entries(specifications ?? {})) {
    const value = String(rawValue).trim();
    if (!value) continue;
    map.set(normalizeLabel(label), { label, value });
  }

  return Array.from(map.values());
}
