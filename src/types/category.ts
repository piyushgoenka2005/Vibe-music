export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  /** Computed at runtime from products.json — not persisted. */
  productCount?: number;
}
