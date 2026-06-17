export interface CursorPageResult<T> {
  items: T[];
  hasMore: boolean;
  nextCursor?: string;
}

/** Paginate a stable-sorted list using document id as cursor. */
export function paginateSortedById<T extends { id: string }>(
  items: T[],
  options: { limit?: number; cursor?: string } = {}
): CursorPageResult<T> {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  let start = 0;

  if (options.cursor) {
    const index = items.findIndex((item) => item.id === options.cursor);
    start = index >= 0 ? index + 1 : 0;
  }

  const window = items.slice(start, start + limit + 1);
  const hasMore = window.length > limit;
  const pageItems = window.slice(0, limit);

  return {
    items: pageItems,
    hasMore,
    nextCursor:
      hasMore && pageItems.length > 0
        ? pageItems[pageItems.length - 1]!.id
        : undefined,
  };
}
