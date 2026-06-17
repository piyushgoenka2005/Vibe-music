"use client";

import { useCallback, useState } from "react";

export function useAdminCursorPagination() {
  const [cursorStack, setCursorStack] = useState<string[]>([]);

  const cursor = cursorStack[cursorStack.length - 1];
  const pageIndex = cursorStack.length;

  const reset = useCallback(() => {
    setCursorStack([]);
  }, []);

  const goNext = useCallback((nextCursor?: string) => {
    if (!nextCursor) return;
    setCursorStack((stack) => [...stack, nextCursor]);
  }, []);

  const goPrev = useCallback(() => {
    setCursorStack((stack) => stack.slice(0, -1));
  }, []);

  return {
    cursor,
    pageIndex,
    canGoPrev: pageIndex > 0,
    reset,
    goNext,
    goPrev,
  };
}
