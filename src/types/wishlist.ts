export interface WishlistShareItem {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  imageColor: string;
  availability?: "in-stock" | "limited" | "out-of-stock";
  addedAt: number;
}

export interface WishlistShareRecord {
  id: string;
  token: string;
  items: WishlistShareItem[];
  userId?: string | null;
  viewCount: number;
  createdAt: string;
  expiresAt?: string | null;
}
