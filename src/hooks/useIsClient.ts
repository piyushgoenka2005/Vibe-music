"use client";

import { useCallback, useSyncExternalStore } from "react";

export function useIsClient() {
  const subscribe = useCallback((onStoreChange: () => void) => {
    const timer = window.setTimeout(onStoreChange, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
