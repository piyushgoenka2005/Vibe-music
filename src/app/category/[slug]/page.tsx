import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import CategoryPage from "@/components/category/CategoryPage";
import { collectCategoryRouteSlugs } from "@/lib/categorySlug";
import { loadCategoryProducts } from "@/lib/server/categoryPageLoader";
import {
  getCategoryCatalog,
  isCanonicalCategorySlug,
  resolveCategoryBySlug,
} from "@/lib/server/categoryResolver";
import { categoryPath } from "@/lib/routes";
import { DEFAULT_FILTERS } from "@/types/filters";

export const dynamicParams = true;
export const revalidate = 60;

interface CategoryRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  if (process.env.NODE_ENV === "development") {
    return [];
  }
  const categories = await getCategoryCatalog();
  return collectCategoryRouteSlugs(categories).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: CategoryRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await resolveCategoryBySlug(slug);
  if (!category) return {};

  return {
    title: category.name,
    description: category.description,
  };
}

export default async function CategoryRoute({ params }: CategoryRouteProps) {
  const { slug } = await params;
  const category = await resolveCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  if (!isCanonicalCategorySlug(category, slug)) {
    redirect(categoryPath(category.slug));
  }

  const initialData = await loadCategoryProducts(category.slug, DEFAULT_FILTERS);

  return (
    <main className="storefront-page">
      <CategoryPage category={category} initialData={initialData} />
    </main>
  );
}
