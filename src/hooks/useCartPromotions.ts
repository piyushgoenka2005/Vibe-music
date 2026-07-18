"use client";

import { useEffect } from "react";
import { fetchCartPromotions } from "@/services/cart.service";
import { useCartStore } from "@/store/cartStore";
import { useCartHydrated } from "@/hooks/useCartHydrated";

/** Load cart promo config and sync free-gift line items. */
export function useCartPromotions(enabled = true) {
  const hydrated = useCartHydrated();
  const setPromoConfig = useCartStore((s) => s.setPromoConfig);
  const syncPromoRewards = useCartStore((s) => s.syncPromoRewards);

  useEffect(() => {
    if (!enabled || !hydrated) return;

    let cancelled = false;

    void (async () => {
      try {
        const config = await fetchCartPromotions();
        if (cancelled) return;
        setPromoConfig(config);
      } catch {
        if (cancelled) return;
        syncPromoRewards();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, hydrated, setPromoConfig, syncPromoRewards]);
}
