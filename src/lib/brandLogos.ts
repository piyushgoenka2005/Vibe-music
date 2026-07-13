/** Known brand logo assets keyed by catalog slug. */
const BRAND_LOGO_BY_SLUG: Record<string, string> = {
  gibson: "/images/big-names-deals/gibson-logo.svg",
  epiphone: "/images/big-names-deals/epiphone-logo.svg",
  prs: "/images/big-names-deals/prs-logo.svg",
  ibanez: "/images/big-names-deals/ibanez-logo.svg",
  fender: "/images/big-names-deals/fender-logo.svg",
  // Shop top brands strip — from Vibe images/LOGO - Copy
  hertz: "/images/brands/hertz.png",
  avus: "/images/brands/avus.png",
  roland: "/images/brands/roland.png",
  zoom: "/images/brands/zoom.png",
  gibraltar: "/images/brands/gibraltar.png",
  adeon: "/images/brands/adeon.png",
  zildjian: "/images/brands/zildjian.png",
  hartke: "/images/brands/hartke.png",
  "m-audio": "/images/brands/m-audio.png",
  "sound-x": "/images/brands/sound-x.png",
  trinity: "/images/brands/trinity.jpg",
};

export function getBrandLogoUrl(slug: string): string | undefined {
  return BRAND_LOGO_BY_SLUG[slug.toLowerCase()];
}
