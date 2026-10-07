"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Gift, Copy, Check } from "lucide-react";

interface ReferralCouponResponse {
  coupon: {
    code: string;
    label: string;
    type: "percentage" | "flat";
    value: number;
    maxUsesPerUser?: number;
    usedCount: number;
    isActive: boolean;
  };
  shareUrl: string;
}

function formatDiscount(coupon: ReferralCouponResponse["coupon"]): string {
  return coupon.type === "percentage" ? `${coupon.value}% off` : `₹${coupon.value} off`;
}

export default function AccountReferralCard() {
  const [copiedField, setCopiedField] = useState<"code" | "link" | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["account-referral-coupon"],
    queryFn: async () => {
      const res = await fetch("/api/account/referral-coupon");
      if (!res.ok) throw new Error("Unable to load referral coupon");
      return res.json() as Promise<ReferralCouponResponse>;
    },
    staleTime: 60_000,
  });

  const copyValue = async (value: string, field: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(null), 2000);
    } catch {
      setCopiedField(null);
    }
  };

  if (isLoading) {
    return (
      <section className="acct__card" style={{ marginTop: "1.5rem" }}>
        <h3 className="acct__card-title">Refer a friend</h3>
        <p className="acct__section-sub">Loading your referral code…</p>
      </section>
    );
  }

  if (isError || !data?.coupon) {
    return null;
  }

  const { coupon, shareUrl } = data;

  return (
    <section className="acct__card" style={{ marginTop: "1.5rem" }}>
      <div className="acct__card-header">
        <h3 className="acct__card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Gift size={18} aria-hidden />
          Refer a friend
        </h3>
      </div>
      <div className="acct__card-body">
        <p className="acct__section-sub" style={{ marginBottom: 12 }}>
          Share your code for {formatDiscount(coupon)}. Friends get the discount at checkout.
        </p>
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <code
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "var(--surface-2, #f4f4f5)",
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            {coupon.code}
          </code>
          <button
            type="button"
            className="acct__btn acct__btn--ghost acct__btn--sm"
            onClick={() => void copyValue(coupon.code, "code")}
          >
            {copiedField === "code" ? <Check size={14} /> : <Copy size={14} />}
            {copiedField === "code" ? "Copied" : "Copy code"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            className="acct__input"
            style={{ flex: 1, minWidth: 200 }}
            value={shareUrl}
            readOnly
            aria-label="Referral share link"
          />
          <button
            type="button"
            className="acct__btn acct__btn--primary acct__btn--sm"
            onClick={() => void copyValue(shareUrl, "link")}
          >
            {copiedField === "link" ? "Copied" : "Copy link"}
          </button>
        </div>
        {coupon.maxUsesPerUser ? (
          <p className="acct__section-sub" style={{ marginTop: 12, marginBottom: 0 }}>
            Each friend can use this code up to {coupon.maxUsesPerUser} time
            {coupon.maxUsesPerUser === 1 ? "" : "s"}.
          </p>
        ) : null}
      </div>
    </section>
  );
}
