"use client";

import { useState } from "react";
import { buildCouponShareUrl } from "@/lib/coupons/couponShareUrl";

interface CouponShareLinkProps {
  code: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
}

export default function CouponShareLink({
  code,
  utmSource,
  utmMedium,
  utmCampaign,
  utmContent,
}: CouponShareLinkProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = buildCouponShareUrl({
    code,
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
  });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="admin-form-group" style={{ gridColumn: "1 / -1" }}>
      <label>Share link</label>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <input
          className="admin-input"
          style={{ flex: 1, minWidth: 240 }}
          value={shareUrl}
          readOnly
        />
        <button
          type="button"
          className="admin-btn admin-btn--secondary"
          onClick={() => void copyLink()}
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      <p style={{ margin: "0.35rem 0 0", fontSize: "0.8rem", color: "var(--admin-muted)" }}>
        Opens checkout with coupon and UTM parameters pre-filled.
      </p>
    </div>
  );
}
