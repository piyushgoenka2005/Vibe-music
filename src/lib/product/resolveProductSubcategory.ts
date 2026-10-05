export interface SubcategoryCandidate {
  subcategory: string;
  productType?: string;
}

interface SpecEntry {
  label: string;
  value: string;
}

/** Spec labels (normalized) that carry the product's subcategory, in priority order. */
const SUBCATEGORY_SPEC_LABELS = [
  "subcategory",
  "product subcategory",
  "product type",
  "item type",
  "item type name",
];

function normalizePhrase(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function singularTokens(value: string): string[] {
  return normalizePhrase(value)
    .split(" ")
    .filter(Boolean)
    .map((token) =>
      token.length > 3 && token.endsWith("s") && !token.endsWith("ss") ? token.slice(0, -1) : token,
    );
}

function phraseKey(value: string): string {
  return singularTokens(value).join(" ");
}

function primarySegment(value: string): string {
  return value.split(/\s+[/|]\s+|\s*\|\s*/)[0]?.trim() ?? "";
}

function isSamePhrase(a: string, b: string | undefined): boolean {
  return Boolean(b) && phraseKey(a) === phraseKey(b!);
}

export function deriveSubcategoryFromSpecs(
  specifications?: Record<string, string> | null,
  detailSpecs?: SpecEntry[] | null,
  categoryName?: string,
): string {
  const entries: Array<[string, unknown]> = [
    ...Object.entries(specifications ?? {}),
    ...(Array.isArray(detailSpecs) ? detailSpecs : []).map(
      (spec) => [spec?.label ?? "", spec?.value] as [string, unknown],
    ),
  ];

  for (const label of SUBCATEGORY_SPEC_LABELS) {
    for (const [key, value] of entries) {
      if (normalizePhrase(key) !== label) continue;
      const trimmed = typeof value === "string" ? value.trim() : "";
      if (trimmed && !isSamePhrase(trimmed, categoryName)) return trimmed;
    }
  }
  return "";
}

function canonicalize(
  value: string,
  candidates: SubcategoryCandidate[],
  includeProductTypes: boolean,
): string {
  for (const phrase of [value, primarySegment(value)]) {
    const key = phraseKey(phrase);
    if (!key) continue;
    const match = candidates.find(
      (candidate) =>
        phraseKey(candidate.subcategory) === key ||
        (includeProductTypes && candidate.productType && phraseKey(candidate.productType) === key),
    );
    if (match) return match.subcategory;
  }
  return "";
}

function matchFromName(name: string, candidates: SubcategoryCandidate[]): string {
  const nameTokens = new Set(singularTokens(name));
  let best: { subcategory: string; weight: number } | null = null;

  for (const candidate of candidates) {
    const phrases = [
      candidate.subcategory,
      primarySegment(candidate.subcategory),
      candidate.productType ?? "",
    ];
    for (const phrase of phrases) {
      const tokens = singularTokens(phrase);
      if (tokens.length === 0 || !tokens.every((token) => nameTokens.has(token))) continue;
      if (!best || tokens.length > best.weight) {
        best = { subcategory: candidate.subcategory, weight: tokens.length };
      }
    }
  }
  return best?.subcategory ?? "";
}

/**
 * Resolves a product's subcategory from, in order: the value entered in admin, its
 * "Product Type"/"Item Type" specs, then a configured subcategory (admin taxonomy or
 * sibling products in the same category) whose name appears in the product title.
 * Matches are normalized to the configured subcategory name so listing filters group them.
 */
export function resolveProductSubcategory(input: {
  subcategory?: string | null;
  name: string;
  categoryName?: string;
  specifications?: Record<string, string> | null;
  detailSpecs?: SpecEntry[] | null;
  candidates?: SubcategoryCandidate[];
}): string {
  const candidates = (input.candidates ?? []).filter(
    (candidate) =>
      candidate.subcategory?.trim() && !isSamePhrase(candidate.subcategory, input.categoryName),
  );

  const explicit = input.subcategory?.trim();
  if (explicit) return canonicalize(explicit, candidates, false) || explicit;

  const fromSpecs = deriveSubcategoryFromSpecs(
    input.specifications,
    input.detailSpecs,
    input.categoryName,
  );
  if (fromSpecs) return canonicalize(fromSpecs, candidates, true) || fromSpecs;

  return matchFromName(input.name, candidates);
}
