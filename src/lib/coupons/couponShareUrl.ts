import { BRAND } from "@/lib/brand";

export interface CouponUtmFields {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
}

export interface CouponShareInput extends CouponUtmFields {
  code: string;
}

/** Build a checkout URL with coupon code and optional UTM parameters. */
export function buildCouponShareUrl(
  coupon: CouponShareInput,
  baseUrl: string = BRAND.siteUrl,
): string {
  const url = new URL("/checkout", baseUrl.replace(/\/+$/, ""));
  url.searchParams.set("coupon", coupon.code.trim().toUpperCase());

  if (coupon.utmSource?.trim()) {
    url.searchParams.set("utm_source", coupon.utmSource.trim());
  }
  if (coupon.utmMedium?.trim()) {
    url.searchParams.set("utm_medium", coupon.utmMedium.trim());
  }
  if (coupon.utmCampaign?.trim()) {
    url.searchParams.set("utm_campaign", coupon.utmCampaign.trim());
  }
  if (coupon.utmContent?.trim()) {
    url.searchParams.set("utm_content", coupon.utmContent.trim());
  }

  return url.toString();
}

/** Parse UTM params from a URL search string or URLSearchParams. */
export function parseUtmFromSearchParams(params: URLSearchParams | string): CouponUtmFields {
  const search = typeof params === "string" ? new URLSearchParams(params) : params;

  return {
    utmSource: search.get("utm_source")?.trim() || undefined,
    utmMedium: search.get("utm_medium")?.trim() || undefined,
    utmCampaign: search.get("utm_campaign")?.trim() || undefined,
    utmContent: search.get("utm_content")?.trim() || undefined,
  };
}
