import type { CompareItemRecord } from "@/types/compare";

export const MAX_COMPARE = 4;

export function normalizeCompareItems(raw: unknown): CompareItemRecord[] {
  if (!Array.isArray(raw)) return [];
  const items: CompareItemRecord[] = [];
  const seen = new Set<string>();
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as CompareItemRecord;
    if (typeof item.productId !== "string" || seen.has(item.productId)) continue;
    seen.add(item.productId);
    items.push({
      productId: item.productId,
      slug: item.slug,
      name: item.name,
      brand: item.brand,
      price: Number(item.price) || 0,
      image: item.image ?? "",
      imageColor: item.imageColor ?? "",
      availability: item.availability ?? "in-stock",
      rating: Number(item.rating) || 0,
      reviewCount: Number(item.reviewCount) || 0,
      addedAt: Number(item.addedAt) || Date.now(),
    });
    if (items.length >= MAX_COMPARE) break;
  }
  return items;
}

export function mergeCompareItems(
  local: CompareItemRecord[],
  remote: CompareItemRecord[]
): CompareItemRecord[] {
  const map = new Map<string, CompareItemRecord>();
  [...remote, ...local].forEach((item) => {
    const existing = map.get(item.productId);
    if (!existing || item.addedAt > existing.addedAt) {
      map.set(item.productId, item);
    }
  });
  return Array.from(map.values())
    .sort((a, b) => b.addedAt - a.addedAt)
    .slice(0, MAX_COMPARE);
}

export function canAddCompareItem(
  items: CompareItemRecord[],
  productId: string
): { ok: boolean; reason?: string } {
  if (items.some((i) => i.productId === productId)) {
    return { ok: true };
  }
  if (items.length >= MAX_COMPARE) {
    return { ok: false, reason: "Compare list is full (max 4 products)" };
  }
  return { ok: true };
}

export function availabilityLabel(availability: string): string {
  if (availability === "in-stock") return "In stock";
  if (availability === "limited") return "Limited";
  return "Out of stock";
}

export function conditionLabel(condition: string | undefined): string {
  if (condition === "used") return "Pre-owned";
  if (condition === "open-box") return "Open box";
  if (condition === "new") return "New";
  return "—";
}

export function collectSpecLabels(
  specsBySlug: Record<string, Array<{ label: string; value: string }>>
): string[] {
  const labels: string[] = [];
  const seen = new Set<string>();
  for (const specs of Object.values(specsBySlug)) {
    for (const spec of specs) {
      const label = spec.label.trim();
      if (!label || seen.has(label)) continue;
      seen.add(label);
      labels.push(label);
    }
  }
  return labels;
}

export function specValue(
  specsBySlug: Record<string, Array<{ label: string; value: string }>>,
  slug: string,
  label: string
): string {
  const match = (specsBySlug[slug] ?? []).find((spec) => spec.label.trim() === label);
  return match?.value?.trim() || "—";
}
