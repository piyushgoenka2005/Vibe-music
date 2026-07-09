"use client";

import { useSyncExternalStore } from "react";
import { useCartStore } from "@/store/cartStore";

export function useCartHydrated(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => useCartStore.persist.onFinishHydration(onStoreChange),
    () => useCartStore.persist.hasHydrated(),
    () => false
  );
}
