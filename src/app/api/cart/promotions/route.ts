import { NextResponse } from "next/server";
import {
  getCartPromotionsConfig,
  type CartGiftProductSummary,
  type CartPromotionsPublic,
} from "@/lib/cart/cartPromotions";
import { getProductById } from "@/services/catalogService";
import { resolvePositiveUnitPrice } from "@/lib/pricing/unitPrice";

async function resolveGiftProduct(
  giftProductId: string | null
): Promise<CartGiftProductSummary | null> {
  if (!giftProductId) return null;

  const product = await getProductById(giftProductId);
  if (!product || product.status !== "active") return null;

  const price = resolvePositiveUnitPrice(product.price) ?? product.price;
  const originalPrice =
    product.originalPrice > price ? product.originalPrice : price;

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    image: product.images?.[0] || product.image,
    imageColor: product.imageColor,
    originalPrice,
    price,
    gstRate: product.gstRate,
    categorySlug: product.categorySlug,
  };
}

export async function GET() {
  const config = getCartPromotionsConfig();
  const giftProduct = await resolveGiftProduct(config.giftProductId);

  const payload: CartPromotionsPublic = {
    ...config,
    bannerText: config.giftProductId
      ? `Free gift on orders above ₹${config.freeGiftThreshold.toLocaleString("en-IN")}`
      : config.bannerText,
    giftProduct,
  };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
