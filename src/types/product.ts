export type ProductAvailability = "in-stock" | "out-of-stock" | "limited";
export type ProductCondition = "new" | "used" | "open-box";

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  brandSlug: string;
  category: string;
  categorySlug: string;
  price: number;
  /** GST rate in percent (5, 12, 18, or 28). Defaults from category if omitted. */
  gstRate?: 5 | 12 | 18 | 28;
  rating: number;
  reviewCount: number;
  availability: ProductAvailability;
  condition: ProductCondition;
  imageColor: string;
  image: string;
}

export interface ProductImage {
  id: string;
  alt: string;
  color: string;
  src?: string;
}

export interface ProductVideo {
  id: string;
  title: string;
  thumbnailColor: string;
  embedUrl: string;
}

export interface ProductVariant {
  id: string;
  label: string;
  sku: string;
  price: number;
  availability: ProductAvailability;
}

export interface ProductReview {
  id: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  date: string;
}

export interface ProductQA {
  id: string;
  question: string;
  answer: string;
  author: string;
  date: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductDetail extends Product {
  sku: string;
  msrp: number | null;
  salePrice: number | null;
  description: string;
  specs: ProductSpec[];
  inTheBox: string[];
  images: ProductImage[];
  videos: ProductVideo[];
  variants: ProductVariant[];
  reviews: ProductReview[];
  qa: ProductQA[];
  frequentlyBoughtTogether: string[];
  similarProductIds: string[];
  relatedProductIds: string[];
}
