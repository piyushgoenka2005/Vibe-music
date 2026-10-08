import type { CouponPdpDisplay, CouponType, StorefrontCouponOffer } from "@/types/coupon";

export interface ResolvedCouponPdpCopy {
  code: string;
  headline: string;
  offerLine: string;
  termsLine: string;
  maxDiscountLine: string | null;
  disclaimer: string;
  buyBoxFooter: string;
}

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);
}

function trimOrEmpty(value?: string | null): string {
  return value?.trim() ?? "";
}

function defaultHeadline(label: string, type: CouponType, value: number): string {
  if (label) return label;
  if (type === "percentage") return `${value}% off`;
  if (type === "flat") return `₹${formatInr(value)} off`;
  return "Free shipping";
}

function defaultOfferLine(type: CouponType, value: number, minOrderAmount?: number): string {
  const minSuffix =
    minOrderAmount != null && minOrderAmount > 0
      ? ` on orders above ₹${formatInr(minOrderAmount)}`
      : "";

  if (type === "percentage") return `${value}% OFF${minSuffix}`;
  if (type === "flat") return `₹${formatInr(value)} OFF${minSuffix}`;
  return `FREE shipping${minSuffix}`;
}

function defaultTermsLine(
  type: CouponType,
  value: number,
  minOrderAmount?: number,
  maxDiscountAmount?: number,
): string {
  const min =
    minOrderAmount != null && minOrderAmount > 0
      ? ` on orders above ₹${formatInr(minOrderAmount)}`
      : "";

  if (type === "percentage") {
    const cap =
      maxDiscountAmount != null && maxDiscountAmount > 0
        ? ` up to ₹${formatInr(maxDiscountAmount)}`
        : "";
    return `${value}% OFF${cap}${min}`;
  }
  if (type === "flat") return `₹${formatInr(value)} off${min}`;
  return `Free shipping${min}`;
}

function defaultMaxDiscountLine(
  type: CouponType,
  value: number,
  maxDiscountAmount?: number,
): string | null {
  if (maxDiscountAmount != null && maxDiscountAmount > 0) {
    return `Maximum Discount ₹${formatInr(maxDiscountAmount)}`;
  }
  if (type === "flat" && value > 0) {
    return `Maximum Discount ₹${formatInr(value)}`;
  }
  return null;
}

export function mapCouponPdpFields(coupon: {
  pdpHeadline?: string | null;
  pdpOfferLine?: string | null;
  pdpMaxDiscountLine?: string | null;
  pdpTermsLine?: string | null;
  pdpDisclaimer?: string | null;
  pdpFooter?: string | null;
}): CouponPdpDisplay {
  const pdp: CouponPdpDisplay = {};
  const headline = trimOrEmpty(coupon.pdpHeadline);
  const offerLine = trimOrEmpty(coupon.pdpOfferLine);
  const maxDiscountLine = trimOrEmpty(coupon.pdpMaxDiscountLine);
  const termsLine = trimOrEmpty(coupon.pdpTermsLine);
  const disclaimer = trimOrEmpty(coupon.pdpDisclaimer);
  const footer = trimOrEmpty(coupon.pdpFooter);

  if (headline) pdp.headline = headline;
  if (offerLine) pdp.offerLine = offerLine;
  if (maxDiscountLine) pdp.maxDiscountLine = maxDiscountLine;
  if (termsLine) pdp.termsLine = termsLine;
  if (disclaimer) pdp.disclaimer = disclaimer;
  if (footer) pdp.footer = footer;

  return pdp;
}

/** Resolve storefront PDP copy — admin overrides win; otherwise derive from coupon rules. */
export function resolveCouponPdpCopy(coupon: StorefrontCouponOffer): ResolvedCouponPdpCopy {
  const pdp = coupon.pdp ?? {};
  const label = trimOrEmpty(coupon.label);

  const offerLine =
    trimOrEmpty(pdp.offerLine) ||
    defaultOfferLine(coupon.type, coupon.value, coupon.minOrderAmount);

  const maxDiscountLine =
    trimOrEmpty(pdp.maxDiscountLine) ||
    defaultMaxDiscountLine(coupon.type, coupon.value, coupon.maxDiscountAmount);

  const termsLine =
    trimOrEmpty(pdp.termsLine) ||
    defaultTermsLine(coupon.type, coupon.value, coupon.minOrderAmount, coupon.maxDiscountAmount);

  const headline = trimOrEmpty(pdp.headline) || defaultHeadline(label, coupon.type, coupon.value);

  return {
    code: coupon.code,
    headline,
    offerLine,
    termsLine,
    maxDiscountLine,
    disclaimer: trimOrEmpty(pdp.disclaimer),
    buyBoxFooter: trimOrEmpty(pdp.footer),
  };
}
