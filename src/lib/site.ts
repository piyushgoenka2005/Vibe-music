import { BRAND } from "@/lib/brand";

export const SITE_NAME = BRAND.name;
export const SITE_DESCRIPTION = `${BRAND.name} is your destination for musical instruments, pro audio, and gear. ${BRAND.tagline}.`;
export const SITE_URL = BRAND.domain;

export function pageTitle(segment?: string): string {
  if (!segment) {
    return `${SITE_NAME}: Musical Instruments, Pro Audio, Accessories & More`;
  }
  return `${segment} | ${SITE_NAME}`;
}
