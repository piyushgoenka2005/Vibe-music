"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgePercent } from "lucide-react";
import { formatCouponLabel } from "@/lib/coupons/formatCouponLabel";
import { useCartStore } from "@/store/cartStore";
import type { StorefrontCouponOffer } from "@/types/coupon";

interface ApplicableCouponsPickerProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function ApplicableCouponsPicker({
  className,
  style,
}: ApplicableCouponsPickerProps) {
  const items = useCartStore((s) => s.items);
  const couponCode = useCartStore((s) => s.couponCode);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const isApplyingCoupon = useCartStore((s) => s.isApplyingCoupon);
  const [offers, setOffers] = useState<StorefrontCouponOffer[]>([]);
  const [loading, setLoading] = useState(false);

  const productIds = useMemo(() => [...new Set(items.map((item) => item.productId))], [items]);

  useEffect(() => {
    if (productIds.length === 0) {
      setOffers([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const res = await fetch(
          `/api/coupons/active?productIds=${encodeURIComponent(productIds.join(","))}`,
        );
        if (!res.ok) throw new Error("Failed to load coupons");
        const payload = (await res.json()) as { coupons: StorefrontCouponOffer[] };
        if (!cancelled) {
          setOffers(payload.coupons ?? []);
        }
      } catch {
        if (!cancelled) setOffers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [productIds]);

  if (productIds.length === 0 || (!loading && offers.length === 0)) {
    return null;
  }

  return (
    <div className={className} style={style}>
      <p className="checkout-summary__promo-label" style={{ marginBottom: 8 }}>
        <BadgePercent size={13} strokeWidth={2.25} aria-hidden />
        Available offers for your items
      </p>
      {loading ? (
        <p className="checkout-summary__promo-hint">Loading offers…</p>
      ) : (
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {offers.map((offer) => {
            const selected = couponCode === offer.code;
            return (
              <li key={offer.code}>
                <button
                  type="button"
                  disabled={isApplyingCoupon || selected}
                  onClick={() => void applyCoupon(offer.code)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: selected
                      ? "2px solid var(--accent, #2563eb)"
                      : "1px solid var(--border, #e5e7eb)",
                    background: selected ? "rgba(37, 99, 235, 0.06)" : "transparent",
                    cursor: selected ? "default" : "pointer",
                  }}
                >
                  <strong>{offer.code}</strong>
                  <span style={{ display: "block", fontSize: "0.85rem", opacity: 0.85 }}>
                    {offer.label} · {formatCouponLabel(offer)}
                    {offer.scope === "products" ? " · Dedicated product offer" : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
