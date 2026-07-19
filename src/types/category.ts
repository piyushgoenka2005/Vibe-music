export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isFeatured?: boolean;
  sortOrder?: number;
  /** Computed at runtime from catalog — not persisted. */
  productCount?: number;
}
