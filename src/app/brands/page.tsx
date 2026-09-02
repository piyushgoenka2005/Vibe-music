import type { Metadata } from "next";
import BrandsPage from "@/components/brands/BrandsPage";
import { loadBrandsWithCounts } from "@/lib/server/brandsPageLoader";
import { withServerPageError } from "@/lib/serverPageError";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Brands",
  description: "Shop pro audio and instrument brands at Vibe Music.",
};

export default async function BrandsRoute() {
  return withServerPageError(async () => {
    const brands = await loadBrandsWithCounts();
    return <BrandsPage brands={brands} />;
  }, "Brands");
}
