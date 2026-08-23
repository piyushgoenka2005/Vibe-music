import "server-only";

/** Clamp a caller-supplied page size to sane bounds. */
export function clampPageLimit(limit: number | undefined, fallback = 20): number {
  const parsed = Number(limit);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.floor(parsed), 1), 100);
}

export interface KeysetPage<T> {
  items: T[];
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * Shared tail of every SQL keyset query: we always fetch `limit + 1` rows so
 * this can decide hasMore without a second count query.
 *
 * @param rows      raw rows from prisma (already ordered desc, take limit+1)
 * @param limit     clamped page size
 * @param cursorOf  extracts the ISO-timestamp cursor from a row
 */
export function pageFromRows<T>(
  rows: T[],
  limit: number,
  cursorOf: (row: T) => string
): KeysetPage<T> {
  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  return {
    items: page,
    hasMore,
    nextCursor:
      hasMore && page.length > 0 ? cursorOf(page[page.length - 1]!) : undefined,
  };
}
