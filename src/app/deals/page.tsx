import type { Metadata } from "next";
import DealsPage from "@/components/deals/DealsPage";
import { loadDealProducts } from "@/lib/server/dealsPageLoader";
import { withServerPageError } from "@/components/common/ServerPageErrorFallback";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Deals",
  description: "Limited-time deals on pro audio, instruments, and studio gear at Vibe Music.",
};

export default async function DealsRoute() {
  return withServerPageError(async () => {
    const products = await loadDealProducts();
    return <DealsPage products={products} />;
  }, "Deals");
}
