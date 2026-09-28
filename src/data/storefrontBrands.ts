import brandsCatalog from "@/data/catalog/brands.json";

/** Brands with purchasable SKUs in the catalog JSON mirror (keep search hints aligned). */
export const STOREFRONT_CATALOG_BRANDS = brandsCatalog
  .map((brand) => brand.name)
  .sort((a, b) => a.localeCompare(b));
