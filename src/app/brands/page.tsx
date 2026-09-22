import type { Metadata } from "next";
import BrandsPage from "@/components/brands/BrandsPage";
import { loadBrandDirectory } from "@/lib/server/brandsPageLoader";
import { withServerPageError } from "@/lib/serverPageError";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Brands | Vibe Music",
  description:
    "Browse every brand stocked at Vibe Music — search, jump A–Z, and shop each collection.",
};

export default async function BrandsRoute() {
  return withServerPageError(async () => {
    const brands = await loadBrandDirectory();
    return <BrandsPage brands={brands} />;
  }, "Brands");
}
