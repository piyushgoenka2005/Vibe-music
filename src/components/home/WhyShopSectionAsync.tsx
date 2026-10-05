import { resolveStoreShippingPolicy } from "@/lib/storefront/resolveStoreShippingPolicy";
import WhyShopSection from "@/components/home/WhyShopSection";

export default async function WhyShopSectionAsync() {
  const shippingPolicy = await resolveStoreShippingPolicy();
  return <WhyShopSection shippingSubtitle={shippingPolicy.whyShop} />;
}
