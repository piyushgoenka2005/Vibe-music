export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  /** Computed at runtime from Firestore — not persisted. */
  productCount?: number;
}
