import { ROUTES } from "@/lib/routes";

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

export const BIG_NAMES_DEALS: BigNamesDealBrand[] = [
  {
    key: "gibson",
    brand: "Gibson",
    href: `${ROUTES.searchResults}?brand=gibson`,
    logo: "/images/big-names-deals/gibson-logo.svg",
    product: "/images/big-names-deals/gibson-product.webp",
    productAlt: "Gibson SG electric guitar in TV yellow",
  },
  {
    key: "epiphone",
    brand: "Epiphone",
    href: `${ROUTES.searchResults}?brand=epiphone`,
    logo: "/images/big-names-deals/epiphone-logo.svg",
    product: "/images/big-names-deals/epiphone-product.webp",
    productAlt: "Epiphone Les Paul in amber sunburst",
  },
  {
    key: "prs",
    brand: "PRS",
    href: `${ROUTES.searchResults}?brand=prs`,
    logo: "/images/big-names-deals/prs-logo.svg",
    product: "/images/big-names-deals/prs-product.webp",
    productAlt: "PRS SE Studio electric guitar in seafoam green",
  },
  {
    key: "ibanez",
    brand: "Ibanez",
    href: `${ROUTES.searchResults}?brand=ibanez`,
    logo: "/images/big-names-deals/ibanez-logo.svg",
    product: "/images/big-names-deals/ibanez-product.webp",
    productAlt: "Ibanez electric guitar in tobacco sunburst",
  },
  {
    key: "fender",
    brand: "Fender",
    href: `${ROUTES.searchResults}?brand=fender`,
    logo: "/images/big-names-deals/fender-logo.svg",
    product: "/images/big-names-deals/fender-product.webp",
    productAlt: "Fender Stratocaster electric guitar in 3-color sunburst",
  },
];
