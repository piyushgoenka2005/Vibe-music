import { getProductById } from "@/services/catalogService";
import { getDefaultGstRateForCategory, type GSTRate } from "@/lib/gstCalculator";
import { validateCoupon } from "@/lib/server/couponService";
import type { CreateOrderPayload } from "@/types/order";

export async function resolveOrderItemsFromFirestore(
  items: CreateOrderPayload["items"]
): Promise<CreateOrderPayload["items"]> {
  return Promise.all(
    items.map(async (item) => {
      const product = await getProductById(item.productId);
      if (product && product.status === "active") {
        const salePrice =
          product.originalPrice > product.price ? product.price : product.price;
        return {
          productId: item.productId,
          name: product.name,
          quantity: item.quantity,
          price: salePrice,
          gstRate: (product.gstRate ??
            item.gstRate ??
            getDefaultGstRateForCategory(product.category)) as GSTRate,
        };
      }
      return item;
    })
  );
}

export async function resolveCouponDiscount(
  couponCode: string | null | undefined,
  subtotal: number
): Promise<number> {
  if (!couponCode) return 0;
  const result = await validateCoupon(couponCode, subtotal);
  return result.valid ? result.discount : 0;
}
