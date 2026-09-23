/** Scanner card data — prefer catalog-backed fields (name/price/image/slug). */
export interface ScannerProduct {
  id: string;
  name: string;
  price: string;
  image: string;
  imageAlt: string;
  href?: string;
  slug?: string;
  /** Optional badge e.g. Featured, Trending, New. */
  tag?: string | null;
}

export type ScannerRowCurve = "up" | "flat" | "down";
