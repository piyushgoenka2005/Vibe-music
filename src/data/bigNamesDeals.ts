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
 * Featured guitar showcase — brand labels match the live catalog brand (Hertz).
 * Visuals use product photography so we never mislabel another brand's gear.
 */
export const BIG_NAMES_DEALS: BigNamesDealBrand[] = [
  {
    key: "hertz-hza-uk-24",
    brand: "Hertz",
    productSlug: "hertz-hertz-hza-uk-24-hertz-hza-uk-24",
    href: productPath("hertz-hertz-hza-uk-24-hertz-hza-uk-24"),
    logo: "/images/big-names-deals/gibson-logo.svg",
    product: "/images/big-names-deals/gibson-product.webp",
    productAlt: "Hertz HZA-UK(24) professional guitar",
  },
  {
    key: "hertz-hza-3900",
    brand: "Hertz",
    productSlug: "hertz-hza-3900-hza-3900",
    href: productPath("hertz-hza-3900-hza-3900"),
    logo: "/images/big-names-deals/epiphone-logo.svg",
    product: "/images/big-names-deals/epiphone-product.webp",
    productAlt: "Hertz HZA-3900 acoustic guitar",
  },
  {
    key: "hertz-hza-3600",
    brand: "Hertz",
    productSlug: "hertz-hza-3600-hza-3600",
    href: productPath("hertz-hza-3600-hza-3600"),
    logo: "/images/big-names-deals/prs-logo.svg",
    product: "/images/big-names-deals/prs-product.webp",
    productAlt: "Hertz HZA-3600 natural finish acoustic",
  },
  {
    key: "hertz-hza3900eq",
    brand: "Hertz",
    productSlug: "hertz-hza3900eq-hza3900eq",
    href: productPath("hertz-hza3900eq-hza3900eq"),
    logo: "/images/big-names-deals/ibanez-logo.svg",
    product: "/images/big-names-deals/ibanez-product.webp",
    productAlt: "Hertz HZA3900EQ electro acoustic guitar",
  },
  {
    key: "hertz-hza-6000",
    brand: "Hertz",
    productSlug: "hertz-hza-6000-hza-6000",
    href: productPath("hertz-hza-6000-hza-6000"),
    logo: "/images/big-names-deals/fender-logo.svg",
    product: "/images/big-names-deals/fender-product.webp",
    productAlt: "Hertz HZA-6000 acoustic guitar",
  },
];
