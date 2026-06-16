import type { ProductAvailability } from "@/types/product";

export interface GearStory {
  id: string;
  title: string;
  productId: string;
  videoUrl: string;
  posterUrl: string;
  category: string;
  price: number;
  originalPrice: number;
  salePrice: number | null;
  discountPercentage: number;
  description: string;
  features: string[];
  slug: string;
  brand: string;
  name: string;
  rating: number;
  reviewCount: number;
  availability: ProductAvailability;
  image: string;
  images: string[];
}

export interface GearStorySeed {
  id: string;
  title: string;
  productId: string;
  videoUrl: string;
  description: string;
  features: string[];
}

export interface GearStoriesSectionData {
  title: string;
  subtitle: string;
  stories: GearStory[];
}
