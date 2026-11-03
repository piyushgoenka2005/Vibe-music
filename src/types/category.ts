export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  imageUrl?: string;
  featuredImageUrls?: string[];
  isFeatured?: boolean;
  isActive?: boolean;
  isArchived?: boolean;
  sortOrder?: number;
  /** Computed at runtime from catalog — not persisted. */
  productCount?: number;
}
