import { normalizeSpecLabel } from "@/lib/product/groupProductSpecs";

/** Spec labels that must not appear on the public PDP (SEO / internal catalog fields). */
const HIDDEN_SPEC_LABELS = new Set(["keywords", "keyword"]);

export function isPublicProductSpecLabel(label: string): boolean {
  const key = normalizeSpecLabel(label);
  return key.length > 0 && !HIDDEN_SPEC_LABELS.has(key);
}

export function filterPublicProductSpecs<T extends { label: string }>(specs: T[]): T[] {
  return specs.filter((spec) => isPublicProductSpecLabel(spec.label));
}
