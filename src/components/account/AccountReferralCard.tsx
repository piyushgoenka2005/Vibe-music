"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Gift, Copy, Check, RefreshCw } from "lucide-react";
import type { AccountReferralPayload } from "@/types/accountReferral";

function formatDiscount(coupon: AccountReferralPayload["coupon"]): string {
  if (coupon.type === "free_shipping") return "free shipping";
  return coupon.type === "percentage" ? `${coupon.value}% off` : `₹${coupon.value} off`;
}

interface AccountReferralCardProps {
  initialReferral?: AccountReferralPayload | null;
}

export default function AccountReferralCard({ initialReferral = null }: AccountReferralCardProps) {
  const [copiedField, setCopiedField] = useState<"code" | "link" | null>(null);

  const { data, isPending, isError, isFetching, refetch } = useQuery({
    queryKey: ["account-referral-coupon"],
    queryFn: async () => {
      const res = await fetch("/api/account/referral-coupon", { credentials: "same-origin" });
      if (!res.ok) throw new Error("Unable to load referral coupon");
      return res.json() as Promise<AccountReferralPayload>;
    },
    initialData: initialReferral ?? undefined,
    staleTime: 60_000,
    retry: 1,
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

  const showLoading = !data && (isPending || isFetching);

  if (showLoading) {
    return (
      <section className="acct__referral" aria-busy="true" aria-label="Loading referral code">
        <div className="acct__referral-inner">
          <div className="acct__referral-head">
            <div className="acct__stat-icon acct__stat-icon--amber">
              <Gift size={20} strokeWidth={2} aria-hidden />
            </div>
            <div className="acct__referral-copy">
              <h3 className="acct__referral-title">Refer a friend</h3>
              <p className="acct__referral-sub">Preparing your personal referral code…</p>
            </div>
          </div>
          <div className="acct__referral-skeleton" aria-hidden>
            <span className="acct__referral-skeleton-code" />
            <span className="acct__referral-skeleton-btn" />
          </div>
        </div>
      </section>
    );
  }

  if (isError || !data?.coupon) {
    return (
      <section className="acct__referral acct__referral--error">
        <div className="acct__referral-inner">
          <div className="acct__referral-head">
            <div className="acct__stat-icon acct__stat-icon--amber">
              <Gift size={20} strokeWidth={2} aria-hidden />
            </div>
            <div className="acct__referral-copy">
              <h3 className="acct__referral-title">Refer a friend</h3>
              <p className="acct__referral-sub">
                We couldn&apos;t load your referral code right now. Please try again.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="acct__btn acct__btn--secondary acct__btn--sm"
            onClick={() => void refetch()}
          >
            <RefreshCw size={14} aria-hidden />
            Try again
          </button>
        </div>
      </section>
    );
  }

  const { coupon, shareUrl } = data;

  return (
    <section className="acct__referral">
      <div className="acct__referral-inner">
        <div className="acct__referral-head">
          <div className="acct__stat-icon acct__stat-icon--amber">
            <Gift size={20} strokeWidth={2} aria-hidden />
          </div>
          <div className="acct__referral-copy">
            <h3 className="acct__referral-title">Refer a friend</h3>
            <p className="acct__referral-sub">
              Share your code for <strong>{formatDiscount(coupon)}</strong>. Friends apply it at
              checkout on their order.
            </p>
          </div>
        </div>

        <div className="acct__referral-actions">
          <div className="acct__referral-code-wrap">
            <span className="acct__referral-code-label">Your code</span>
            <code className="acct__referral-code">{coupon.code}</code>
          </div>
          <button
            type="button"
            className="acct__btn acct__btn--ghost acct__btn--sm acct__referral-copy-btn"
            onClick={() => void copyValue(coupon.code, "code")}
          >
            {copiedField === "code" ? (
              <Check size={14} aria-hidden />
            ) : (
              <Copy size={14} aria-hidden />
            )}
            {copiedField === "code" ? "Copied" : "Copy code"}
          </button>
        </div>

        <div className="acct__referral-link-row">
          <label className="acct__referral-code-label" htmlFor="acct-referral-share-url">
            Share link
          </label>
          <div className="acct__referral-link-inputs">
            <input
              id="acct-referral-share-url"
              className="acct__input acct__referral-link-input"
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
        </div>

        {coupon.maxUsesPerUser ? (
          <p className="acct__referral-footnote">
            Each friend can use this code up to {coupon.maxUsesPerUser} time
            {coupon.maxUsesPerUser === 1 ? "" : "s"}.
          </p>
        ) : null}
      </div>
    </section>
  );
}
