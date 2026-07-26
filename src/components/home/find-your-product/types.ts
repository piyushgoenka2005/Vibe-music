/** Scanner card data — prefer catalog-backed fields (name/price/image/slug). */
export interface ScannerProduct {
  id: string;
  name: string;
  price: string;
  revenue: string;
  growth: string;
  image: string;
  imageAlt: string;
  href?: string;
  slug?: string;
}

export type ScannerRowCurve = "up" | "flat" | "down";
