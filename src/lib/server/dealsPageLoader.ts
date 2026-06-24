import "server-only";

import { cache } from "react";
import { getAllProducts, toProduct } from "@/services/catalogService";
import type { Product } from "@/types/product";

export const loadDealProducts = cache(async function loadDealProducts(): Promise<Product[]> {
  const catalog = await getAllProducts(false);
  return catalog
    .filter(
      (item) =>
        item.status === "active" &&
        (item.discountPercentage > 0 ||
          (item.originalPrice > 0 && item.originalPrice > item.price))
    )
    .sort((a, b) => b.discountPercentage - a.discountPercentage)
    .map(toProduct);
});
