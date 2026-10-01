import { ROUTES, productPath } from "@/lib/routes";

export interface BigNamesDealBrand {
  key: string;
  brand: string;
  /** Canonical PDP this showcase guitar opens. */
  productSlug: string;
  href: string;
  logo: string;
  product: string;
  productAlt: string;
  /** Ivory showroom — white-background shots blend via multiply */
  blendMultiply?: boolean;
}

export const BIG_NAMES_DEALS_CTA = ROUTES.deals;

/**
 * Featured guitar showcase — iconic brand logos with curated white-background art.
 * Each slot deep-links to a real Hertz guitar PDP in catalog.
 */
export const BIG_NAMES_DEALS: BigNamesDealBrand[] = [
  {
    key: "gibson",
    brand: "Gibson",
    productSlug: "hertz-hertz-hza-uk-24-hertz-hza-uk-24",
    href: productPath("hertz-hertz-hza-uk-24-hertz-hza-uk-24"),
    logo: "/images/big-names-deals/gibson-logo.svg",
    product: "/images/big-names-deals/gibson-product.webp",
    productAlt: "Gibson-style electric guitar showcase",
    blendMultiply: true,
  },
  {
    key: "epiphone",
    brand: "Epiphone",
    productSlug: "hertz-hza-3900-hza-3900",
    href: productPath("hertz-hza-3900-hza-3900"),
    logo: "/images/big-names-deals/epiphone-logo.svg",
    product: "/images/big-names-deals/epiphone-product.webp",
    productAlt: "Epiphone-style electric guitar showcase",
    blendMultiply: true,
  },
  {
    key: "prs",
    brand: "PRS",
    productSlug: "hertz-hza-3600-hza-3600",
    href: productPath("hertz-hza-3600-hza-3600"),
    logo: "/images/big-names-deals/prs-logo.svg",
    product: "/images/big-names-deals/prs-product.webp",
    productAlt: "PRS-style electric guitar showcase",
    blendMultiply: true,
  },
  {
    key: "ibanez",
    brand: "Ibanez",
    productSlug: "hertz-hza3900eq-hza3900eq",
    href: productPath("hertz-hza3900eq-hza3900eq"),
    logo: "/images/big-names-deals/ibanez-logo.svg",
    product: "/images/big-names-deals/ibanez-product.webp",
    productAlt: "Ibanez-style electric guitar showcase",
    blendMultiply: true,
  },
  {
    key: "fender",
    brand: "Fender",
    productSlug: "hertz-hza-6000-hza-6000",
    href: productPath("hertz-hza-6000-hza-6000"),
    logo: "/images/big-names-deals/fender-logo.svg",
    product: "/images/big-names-deals/fender-product.webp",
    productAlt: "Fender-style electric guitar showcase",
    blendMultiply: true,
  },
];
