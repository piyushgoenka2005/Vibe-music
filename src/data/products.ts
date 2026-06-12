import { getAllProducts, toProduct } from "@/services/catalogService";
import type { Product } from "@/types/product";

/** Server-only product list shim. Prefer catalogService or /api/products. */
export const PRODUCTS: Product[] = getAllProducts().map(toProduct);
