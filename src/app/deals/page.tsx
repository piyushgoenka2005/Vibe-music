import type { Metadata } from "next";
import DealsPage from "@/components/deals/DealsPage";
import { buildDealsMetadata } from "@/lib/seo/adLanding";
import { cdnSeoImageUrl } from "@/lib/storefrontImages";
import { loadDealProducts } from "@/lib/server/dealsPageLoader";
import { withServerPageError } from "@/lib/serverPageError";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  try {
    const products = await loadDealProducts();
    const hero = products[0]?.image;
    return buildDealsMetadata({
      productCount: products.length,
      imageUrl: hero ? cdnSeoImageUrl(hero) : undefined,
    });
  } catch {
    return buildDealsMetadata();
  }
}

export default async function DealsRoute() {
  return withServerPageError(async () => {
    const products = await loadDealProducts();
    return <DealsPage products={products} />;
  }, "Deals");
}
