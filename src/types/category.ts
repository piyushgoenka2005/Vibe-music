export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  imageUrl?: string;
  isFeatured?: boolean;
  sortOrder?: number;
  /** Computed at runtime from catalog — not persisted. */
  productCount?: number;
}
