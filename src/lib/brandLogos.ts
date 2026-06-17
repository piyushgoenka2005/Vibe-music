/** Known brand logo assets keyed by catalog slug. */
const BRAND_LOGO_BY_SLUG: Record<string, string> = {
  gibson: "/images/big-names-deals/gibson-logo.svg",
  epiphone: "/images/big-names-deals/epiphone-logo.svg",
  prs: "/images/big-names-deals/prs-logo.svg",
  ibanez: "/images/big-names-deals/ibanez-logo.svg",
  fender: "/images/big-names-deals/fender-logo.svg",
};

export function getBrandLogoUrl(slug: string): string | undefined {
  return BRAND_LOGO_BY_SLUG[slug.toLowerCase()];
}
