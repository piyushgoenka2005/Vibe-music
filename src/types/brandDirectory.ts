import type { Brand } from "@/types/brand";
import type { Product } from "@/types/product";

export interface BrandWithCount extends Brand {
  productCount: number;
}

export interface BrandDirectoryGroup extends BrandWithCount {
  letter: string;
  logoUrl?: string;
  products: Product[];
}
