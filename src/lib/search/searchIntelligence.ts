import {
  SEARCH_LANDING_QUICK_CHIPS,
  SEARCH_LANDING_TRENDING,
} from "@/data/searchLandingHints";
import { categoryPath, ROUTES } from "@/lib/routes";
import type { SearchSuggestion } from "@/types/search";

/** Curated searchable keywords — not products. */
export const SEARCH_KEYWORD_CATALOG = [
  "Guitar",
  "Acoustic Guitar",
  "Electric Guitar",
  "Bass Guitar",
  "Classical Guitar",
  "Guitar Amplifier",
  "Guitar Strings",
  "Guitar Picks",
  "Guitar Stand",
  "Guitar Strap",
  "Drum Kit",
  "Electronic Drums",
  "Cymbals",
  "Keyboard",
  "Synthesizer",
  "Digital Piano",
  "MIDI Controller",
  "Audio Interface",
  "Studio Monitor",
  "Microphone",
  "Wireless Mic",
  "PA Speaker",
  "Mixer",
  "DJ Controller",
  "Turntable",
  "Effects Pedal",
  "Headphones",
  "Cables",
  "Stands",
  "Live Sound",
  "Studio Recording",
  ...SEARCH_LANDING_TRENDING,
  ...SEARCH_LANDING_QUICK_CHIPS.map((chip) => chip.label),
] as const;

export const SEARCH_POPULAR_BRANDS = [
  "Yamaha",
  "Roland",
  "Zoom",
  "Casio",
  "Hertz",
  "ADEON",
  "Avus",
  "Shure",
  "Focusrite",
  "Behringer",
] as const;

export const SEARCH_POPULAR_CATEGORIES = SEARCH_LANDING_QUICK_CHIPS;

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function singularize(token: string): string {
  if (token.length > 3 && token.endsWith("s")) return token.slice(0, -1);
  return token;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));

  for (let i = 0; i < rows; i += 1) matrix[i][0] = i;
  for (let j = 0; j < cols; j += 1) matrix[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function tokensMatch(queryToken: string, candidateToken: string): boolean {
  if (!queryToken || !candidateToken) return false;
  if (candidateToken.startsWith(queryToken)) return true;

  const q = singularize(queryToken);
  const c = singularize(candidateToken);
  if (c.startsWith(q) || q.startsWith(c)) return true;

  if (queryToken.length >= 4 && candidateToken.length >= 4) {
    const maxDistance = queryToken.length >= 5 ? 2 : 1;
    if (levenshtein(q, c) <= maxDistance) return true;
  }

  if (queryToken.length >= 3 && isCompactMatch(queryToken, candidateToken)) {
    return true;
  }

  return false;
}

function isCompactMatch(query: string, candidate: string): boolean {
  let queryIndex = 0;
  for (let i = 0; i < candidate.length && queryIndex < query.length; i += 1) {
    if (candidate[i] === query[queryIndex]) queryIndex += 1;
  }
  return queryIndex === query.length;
}

export function matchesSearchQuery(label: string, query: string): boolean {
  const normalizedQuery = normalizeToken(query);
  if (!normalizedQuery) return true;

  const normalizedLabel = normalizeToken(label);
  if (normalizedLabel.includes(normalizedQuery)) return true;

  const queryTokens = normalizedQuery.split(" ").filter(Boolean);
  const labelTokens = normalizedLabel.split(" ").filter(Boolean);

  return queryTokens.every((queryToken) =>
    labelTokens.some((labelToken) => tokensMatch(queryToken, labelToken))
  );
}

export function scoreSearchMatch(label: string, query: string): number {
  const normalizedQuery = normalizeToken(query);
  const normalizedLabel = normalizeToken(label);
  if (!normalizedQuery) return 0;

  if (normalizedLabel === normalizedQuery) return 1000;
  if (normalizedLabel.startsWith(normalizedQuery)) return 900 - normalizedLabel.length;
  if (normalizedLabel.includes(normalizedQuery)) return 800 - normalizedLabel.indexOf(normalizedQuery);

  const queryTokens = normalizedQuery.split(" ").filter(Boolean);
  const labelTokens = normalizedLabel.split(" ").filter(Boolean);
  let score = 0;

  for (const queryToken of queryTokens) {
    for (const labelToken of labelTokens) {
      if (labelToken === queryToken) score += 120;
      else if (labelToken.startsWith(queryToken)) score += 100 - labelToken.length;
      else if (tokensMatch(queryToken, labelToken)) score += 70;
    }
  }

  return score;
}

export function enrichKeywordSuggestions(
  keywords: SearchSuggestion[],
  labels: string[],
  query: string,
  limit = 8
): SearchSuggestion[] {
  const seen = new Set(keywords.map((item) => item.label.toLowerCase()));
  const merged = [...keywords];

  for (const label of labels) {
    if (merged.length >= limit) break;
    if (!matchesSearchQuery(label, query)) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({
      id: `keyword-enriched-${key}`,
      type: "keyword",
      label,
      href: `${ROUTES.searchResults}?q=${encodeURIComponent(label)}`,
    });
  }

  return merged
    .map((item) => ({
      item,
      score: scoreSearchMatch(item.label, query),
    }))
    .sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label))
    .slice(0, limit)
    .map((entry) => entry.item);
}

export function buildBrandHints(query: string, limit = 5): SearchSuggestion[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  return SEARCH_POPULAR_BRANDS.filter((brand) => matchesSearchQuery(brand, trimmed))
    .slice(0, limit)
    .map((brand, index) => ({
      id: `brand-hint-${index}-${brand}`,
      type: "brand" as const,
      label: brand,
      href: `${ROUTES.searchResults}?q=${encodeURIComponent(brand)}`,
    }));
}

export function buildEmptyStateSuggestions(): {
  categories: SearchSuggestion[];
  brands: SearchSuggestion[];
  trending: SearchSuggestion[];
} {
  const categories = SEARCH_POPULAR_CATEGORIES.map((chip, index) => ({
    id: `empty-cat-${index}`,
    type: "category" as const,
    label: chip.label,
    href: chip.href,
  }));

  const brands = SEARCH_POPULAR_BRANDS.slice(0, 6).map((brand, index) => ({
    id: `empty-brand-${index}`,
    type: "brand" as const,
    label: brand,
    href: `${ROUTES.searchResults}?q=${encodeURIComponent(brand)}`,
  }));

  const trending = SEARCH_LANDING_TRENDING.map((term, index) => ({
    id: `empty-trend-${index}`,
    type: "keyword" as const,
    label: term,
    href: `${ROUTES.searchResults}?q=${encodeURIComponent(term)}`,
  }));

  return { categories, brands, trending };
}

export function categorySuggestionHref(slug: string): string {
  return categoryPath(slug);
}

export function getPopularQueriesFromAnalytics(
  events: Array<{ query: string }>,
  limit = 6
): string[] {
  const counts = new Map<string, { label: string; count: number }>();

  for (const event of events) {
    const trimmed = event.query.trim();
    if (trimmed.length < 2) continue;
    const key = trimmed.toLowerCase();
    const current = counts.get(key);
    if (current) {
      current.count += 1;
    } else {
      counts.set(key, { label: trimmed, count: 1 });
    }
  }

  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit)
    .map((entry) => entry.label);
}

export function buildKeywordSuggestions(
  query: string,
  limit = 8,
  popularQueries: string[] = []
): SearchSuggestion[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const popularBoost = new Map(
    popularQueries.map((term, index) => [term.toLowerCase(), popularQueries.length - index])
  );

  const ranked = Array.from(new Set(SEARCH_KEYWORD_CATALOG))
    .map((label) => {
      let score = scoreSearchMatch(label, trimmed);
      const boost = popularBoost.get(label.toLowerCase());
      if (boost) score += 150 + boost * 10;
      return { label, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
    .slice(0, limit);

  return ranked.map((entry, index) => ({
    id: `keyword-${index}-${entry.label}`,
    type: "keyword" as const,
    label: entry.label,
    href: `${ROUTES.searchResults}?q=${encodeURIComponent(entry.label)}`,
  }));
}

function wordHighlightRange(
  word: string,
  position: number,
  query: string
): { start: number; end: number } | null {
  const trimmed = query.trim();
  if (!trimmed || !word.trim()) return null;

  const lowerWord = word.toLowerCase();
  const lowerQuery = trimmed.toLowerCase();

  if (lowerWord.startsWith(lowerQuery)) {
    return { start: position, end: position + trimmed.length };
  }

  const queryTokens = normalizeToken(trimmed).split(" ").filter(Boolean);
  const wordTokens = normalizeToken(word).split(" ").filter(Boolean);

  for (const queryToken of queryTokens) {
    for (const wordToken of wordTokens) {
      if (!tokensMatch(queryToken, wordToken)) continue;

      const tokenIndex = lowerWord.indexOf(wordToken);
      if (tokenIndex < 0) continue;

      const highlightLength = wordToken.startsWith(queryToken)
        ? queryToken.length
        : Math.min(queryToken.length, wordToken.length);

      return {
        start: position + tokenIndex,
        end: position + tokenIndex + highlightLength,
      };
    }
  }

  return null;
}

export function findHighlightRange(
  label: string,
  query: string
): { start: number; end: number } | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const lowerLabel = label.toLowerCase();
  const lowerQuery = trimmed.toLowerCase();
  const directIndex = lowerLabel.indexOf(lowerQuery);
  if (directIndex >= 0) {
    return { start: directIndex, end: directIndex + trimmed.length };
  }

  const words = label.split(/(\s+)/);
  let position = 0;
  for (const word of words) {
    if (!word.trim()) {
      position += word.length;
      continue;
    }

    const range = wordHighlightRange(word, position, trimmed);
    if (range) return range;

    position += word.length;
  }

  return null;
}
