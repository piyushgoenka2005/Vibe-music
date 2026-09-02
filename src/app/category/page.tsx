import type { Metadata } from "next";
import CategoriesIndexPage from "@/components/category/CategoriesIndexPage";
import { BRAND } from "@/lib/brand";
import { loadCategoriesForIndex } from "@/lib/server/categoriesPageLoader";
import { withServerPageError } from "@/lib/serverPageError";

export const revalidate = 300;

export const metadata: Metadata = {
  title: `Categories | ${BRAND.name}`,
  description: "Browse all instrument and pro audio departments at Vibe Music.",
  alternates: { canonical: "/category" },
};

export default async function CategoriesIndexRoute() {
  return withServerPageError(async () => {
    const categories = await loadCategoriesForIndex();
    return <CategoriesIndexPage categories={categories} />;
  }, "Categories");
}
