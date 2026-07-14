export const MAX_COMPARE_ITEMS = 4;

export interface CompareItemRecord {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  imageColor: string;
  availability: "in-stock" | "limited" | "out-of-stock";
  rating: number;
  reviewCount: number;
  addedAt: number;
}

export interface CompareShareRecord {
  id: string;
  token: string;
  items: CompareItemRecord[];
  userId?: string | null;
  viewCount: number;
  createdAt: string;
  expiresAt?: string | null;
}

export interface CompareAnalyticsSummary {
  totalEvents: number;
  adds: number;
  removes: number;
  shares: number;
  exports: number;
  shareViews: number;
  topProducts: Array<{ productId: string; name: string; count: number }>;
}

export interface CompareEnrichedProduct extends CompareItemRecord {
  condition?: string;
  specs?: Array<{ label: string; value: string }>;
  brandSlug?: string;
}
