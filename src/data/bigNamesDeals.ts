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
 * Showcase visuals for top brands. Each guitar always deep-links to its
 * respective product page (never a category / search suggestions list).
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
  },
  {
    key: "epiphone",
    brand: "Epiphone",
    productSlug: "hertz-hza-3900-hza-3900",
    href: productPath("hertz-hza-3900-hza-3900"),
    logo: "/images/big-names-deals/epiphone-logo.svg",
    product: "/images/big-names-deals/epiphone-product.webp",
    productAlt: "Epiphone-style Les Paul sunburst showcase",
  },
  {
    key: "prs",
    brand: "PRS",
    productSlug: "hertz-hza-3600-hza-3600",
    href: productPath("hertz-hza-3600-hza-3600"),
    logo: "/images/big-names-deals/prs-logo.svg",
    product: "/images/big-names-deals/prs-product.webp",
    productAlt: "PRS-style seafoam electric guitar showcase",
  },
  {
    key: "ibanez",
    brand: "Ibanez",
    productSlug: "hertz-hza3900eq-hza3900eq",
    href: productPath("hertz-hza3900eq-hza3900eq"),
    logo: "/images/big-names-deals/ibanez-logo.svg",
    product: "/images/big-names-deals/ibanez-product.webp",
    productAlt: "Ibanez-style electric guitar showcase",
  },
  {
    key: "fender",
    brand: "Fender",
    productSlug: "hertz-hza-4060-hza-4060",
    href: productPath("hertz-hza-4060-hza-4060"),
    logo: "/images/big-names-deals/fender-logo.svg",
    product: "/images/big-names-deals/fender-product.webp",
    productAlt: "Fender Stratocaster-style sunburst showcase",
  },
];
