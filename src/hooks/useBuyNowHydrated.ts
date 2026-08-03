"use client";

import { useSyncExternalStore } from "react";
import { useBuyNowStore } from "@/store/buyNowStore";

export function useBuyNowHydrated(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => useBuyNowStore.persist.onFinishHydration(onStoreChange),
    () => useBuyNowStore.persist.hasHydrated(),
    () => false
  );
}
