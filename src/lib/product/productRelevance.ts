import type { CatalogProduct } from "@/types/catalog";

export type ProductInstrumentKind =
  | "amplifier"
  | "acoustic-guitar"
  | "electro-acoustic-guitar"
  | "electric-guitar"
  | "bass-guitar"
  | "ukulele"
  | "generic";

function normalizeText(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function isGuitarAmplifierProduct(product: CatalogProduct): boolean {
  const sub = normalizeText(product.subcategory);
  const name = normalizeText(product.name);
  const sku = product.sku.toUpperCase();
  if (sku === "VM-DG20" || sku === "VM-DG40") return true;
  return (
    sub.includes("amplifier") ||
    name.includes("guitar amplifier") ||
    /\bamplifier\b/.test(name)
  );
}

function looksLikeUkulele(haystack: string, sku: string): boolean {
  if (haystack.includes("ukulele") || haystack.includes("ukelele")) return true;
  if (/\buke\b/.test(haystack)) return true;
  const upper = sku.toUpperCase();
  return /HZA[- ]?UK|HZAUK|UK-?24|UKULELE/i.test(upper) || /hza[- ]?uk/i.test(haystack);
}

export function getProductInstrumentKind(
  product: CatalogProduct
): ProductInstrumentKind {
  if (isGuitarAmplifierProduct(product)) return "amplifier";

  const sub = normalizeText(product.subcategory);
  const name = normalizeText(product.name);
  const productType = normalizeText(product.specifications["Product Type"]);
  const instrument = normalizeText(product.specifications.Instrument);
  const haystack = `${sub} ${name} ${productType} ${instrument}`;

  if (looksLikeUkulele(haystack, product.sku)) return "ukulele";

  if (
    haystack.includes("electro acoustic") ||
    haystack.includes("electro-acoustic") ||
    sub.includes("electro acoustic")
  ) {
    if (haystack.includes("bass")) return "bass-guitar";
    return "electro-acoustic-guitar";
  }

  if (
    (haystack.includes("bass guitar") ||
      (haystack.includes("bass") && haystack.includes("guitar"))) &&
    !haystack.includes("acoustic")
  ) {
    return "bass-guitar";
  }
  if (haystack.includes("bass") && sub.includes("bass")) return "bass-guitar";

  if (
    haystack.includes("electric guitar") ||
    (sub.includes("electric") &&
      !sub.includes("electro") &&
      haystack.includes("guitar"))
  ) {
    return "electric-guitar";
  }

  if (haystack.includes("acoustic guitar") || sub.includes("acoustic")) {
    return "acoustic-guitar";
  }

  return "generic";
}

/**
 * Detect a specific instrument intent from a free-text search query.
 * Returns null for broad queries like "guitar" or "hertz".
 */
export function detectSearchInstrumentIntent(
  query: string
): ProductInstrumentKind | null {
  const value = normalizeText(query);
  if (!value) return null;

  if (
    value.includes("ukulele") ||
    value.includes("ukelele") ||
    /(^|\s)uke(\s|$)/.test(value)
  ) {
    return "ukulele";
  }

  if (
    /\bamplifiers?\b/.test(value) ||
    /(^|\s)amps?(\s|$)/.test(value) ||
    value.includes("guitar amp")
  ) {
    return "amplifier";
  }

  if (
    value.includes("electro acoustic") ||
    value.includes("electro-acoustic") ||
    value.includes("electroacoustic")
  ) {
    return "electro-acoustic-guitar";
  }

  if (
    value.includes("bass guitar") ||
    (/\bbass\b/.test(value) && /\bguitars?\b/.test(value))
  ) {
    return "bass-guitar";
  }

  if (
    value.includes("electric guitar") ||
    value.includes("electric guitars") ||
    (/\belectric\b/.test(value) && /\bguitars?\b/.test(value))
  ) {
    return "electric-guitar";
  }

  if (
    value.includes("acoustic guitar") ||
    value.includes("acoustic guitars") ||
    (/\bacoustic\b/.test(value) && /\bguitars?\b/.test(value))
  ) {
    return "acoustic-guitar";
  }

  return null;
}

export function productMatchesSearchIntent(
  product: CatalogProduct,
  intent: ProductInstrumentKind
): boolean {
  return getProductInstrumentKind(product) === intent;
}

/**
 * Extra score when the catalog product matches a specific search intent.
 * Mismatches are expected to be filtered before scoring; this is a boost only.
 */
export function searchIntentScoreBoost(
  product: CatalogProduct,
  intent: ProductInstrumentKind | null
): number {
  if (!intent) return 0;
  return getProductInstrumentKind(product) === intent ? 80 : 0;
}

export function areMerchandisingPeersCompatible(
  source: CatalogProduct,
  candidate: CatalogProduct
): boolean {
  const sourceKind = getProductInstrumentKind(source);
  const candidateKind = getProductInstrumentKind(candidate);

  if (sourceKind === "amplifier") {
    return (
      candidateKind === "amplifier" || candidateKind === "electric-guitar"
    );
  }
  if (sourceKind === "acoustic-guitar") {
    return (
      candidateKind === "acoustic-guitar" ||
      candidateKind === "electro-acoustic-guitar" ||
      candidateKind === "ukulele"
    );
  }
  if (sourceKind === "electro-acoustic-guitar") {
    return (
      candidateKind === "electro-acoustic-guitar" ||
      candidateKind === "acoustic-guitar"
    );
  }
  if (sourceKind === "electric-guitar") {
    return (
      candidateKind === "electric-guitar" || candidateKind === "amplifier"
    );
  }
  if (sourceKind === "bass-guitar") {
    return candidateKind === "bass-guitar";
  }
  if (sourceKind === "ukulele") {
    return candidateKind === "ukulele";
  }
  return true;
}

function subcategoryMatchScore(
  source: CatalogProduct,
  candidate: CatalogProduct
): number {
  const sourceSub = normalizeText(source.subcategory);
  const candidateSub = normalizeText(candidate.subcategory);
  if (!sourceSub || !candidateSub) return 0;
  if (sourceSub === candidateSub) return 100;
  if (sourceSub.includes(candidateSub) || candidateSub.includes(sourceSub)) {
    return 60;
  }
  return 0;
}

export function scoreMerchandisingPeer(
  source: CatalogProduct,
  candidate: CatalogProduct,
  mode: "similar" | "related"
): number {
  if (!areMerchandisingPeersCompatible(source, candidate)) return 0;

  let score = 0;
  const subScore = subcategoryMatchScore(source, candidate);
  score += mode === "similar" ? subScore * 1.5 : subScore;

  if (source.categorySlug === candidate.categorySlug) score += 25;
  if (source.brandSlug === candidate.brandSlug) {
    score += mode === "related" ? 35 : 18;
  }

  const priceBase = Math.max(source.price, 1);
  const priceDelta = Math.abs(source.price - candidate.price) / priceBase;
  if (priceDelta <= 0.15) score += 30;
  else if (priceDelta <= 0.35) score += 18;
  else if (priceDelta <= 0.6) score += 8;

  score += candidate.rating * 2 + Math.min(candidate.reviewCount, 50) * 0.12;
  if (candidate.stock > 0) score += 6;
  if (candidate.featured) score += 4;
  if (candidate.trending) score += 3;

  return score;
}

export function rankMerchandisingPeers(
  source: CatalogProduct,
  candidates: CatalogProduct[],
  limit: number,
  mode: "similar" | "related",
  excludeIds: Set<string> = new Set()
): CatalogProduct[] {
  const ranked = candidates
    .filter(
      (candidate) =>
        candidate.id !== source.id &&
        !excludeIds.has(candidate.id) &&
        candidate.status === "active" &&
        candidate.price > 0
    )
    .map((candidate) => ({
      candidate,
      score: scoreMerchandisingPeer(source, candidate, mode),
    }))
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.candidate.name.localeCompare(b.candidate.name)
    );

  return ranked.slice(0, limit).map((entry) => entry.candidate);
}
