import { ROUTES, categoryPath } from "@/lib/routes";

export interface BigNamesDealBrand {
  key: string;
  brand: string;
  href: string;
  logo: string;
  product: string;
  productAlt: string;
  /** Ivory showroom — white-background shots blend via multiply */
  blendMultiply?: boolean;
}

export const BIG_NAMES_DEALS_CTA = ROUTES.deals;

/** Showcase visuals for top brands — hrefs fall back to guitars category;
 * runtime resolution prefers live catalog guitar PDPs. */
export const BIG_NAMES_DEALS: BigNamesDealBrand[] = [
  {
    key: "gibson",
    brand: "Gibson",
    href: categoryPath("guitars"),
    logo: "/images/big-names-deals/gibson-logo.svg",
    product: "/images/big-names-deals/gibson-product.webp",
    productAlt: "Gibson-style electric guitar showcase",
  },
  {
    key: "epiphone",
    brand: "Epiphone",
    href: categoryPath("guitars"),
    logo: "/images/big-names-deals/epiphone-logo.svg",
    product: "/images/big-names-deals/epiphone-product.webp",
    productAlt: "Epiphone-style Les Paul sunburst showcase",
  },
  {
    key: "prs",
    brand: "PRS",
    href: categoryPath("guitars"),
    logo: "/images/big-names-deals/prs-logo.svg",
    product: "/images/big-names-deals/prs-product.webp",
    productAlt: "PRS-style seafoam electric guitar showcase",
  },
  {
    key: "ibanez",
    brand: "Ibanez",
    href: categoryPath("guitars"),
    logo: "/images/big-names-deals/ibanez-logo.svg",
    product: "/images/big-names-deals/ibanez-product.webp",
    productAlt: "Ibanez-style electric guitar showcase",
  },
  {
    key: "fender",
    brand: "Fender",
    href: categoryPath("guitars"),
    logo: "/images/big-names-deals/fender-logo.svg",
    product: "/images/big-names-deals/fender-product.webp",
    productAlt: "Fender Stratocaster-style sunburst showcase",
  },
];
