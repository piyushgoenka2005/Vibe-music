"use client";

import { useEffect, useRef } from "react";
import { useCartHydrated } from "@/hooks/useCartHydrated";
import { fetchCartReprice } from "@/services/cart.service";
import { useCartStore } from "@/store/cartStore";
import { useToastStore } from "@/store/toastStore";

/** Keep cart unit prices aligned with catalog (same source as checkout/Razorpay). */
export function useCartCatalogReprice(enabled = true) {
  const hydrated = useCartHydrated();
  const items = useCartStore((s) => s.items);
  const applyCatalogPrices = useCartStore((s) => s.applyCatalogPrices);
  const lastSignature = useRef<string | null>(null);
  const inFlight = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !hydrated || items.length === 0) return;

    const signature = items
      .map((item) => `${item.lineId}:${item.quantity}`)
      .sort()
      .join("|");

    if (lastSignature.current === signature || inFlight.current === signature) {
      return;
    }

    inFlight.current = signature;
    let cancelled = false;

    void (async () => {
      try {
        const result = await fetchCartReprice(items);
        if (cancelled) return;

        const priced = result.items.filter((line) => !line.error && line.price > 0);
        applyCatalogPrices(
          priced.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            price: line.price,
            originalPrice: line.originalPrice,
            name: line.name,
            gstRate: line.gstRate,
            variantSku: line.variantSku,
            variantLabel: line.variantLabel,
            image: line.image,
            brand: line.brand,
            slug: line.slug,
          }))
        );

        lastSignature.current = signature;

        const failed = result.items.filter((line) => line.error);
        if (failed.length > 0) {
          useToastStore
            .getState()
            .show(
              `${failed.length} item${failed.length === 1 ? "" : "s"} could not be priced and may need to be removed.`,
              "error"
            );
        }
      } catch {
        useToastStore
          .getState()
          .show("Unable to refresh cart prices. Totals may be outdated.", "error");
      } finally {
        if (inFlight.current === signature) inFlight.current = null;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, hydrated, items, applyCatalogPrices]);
}
