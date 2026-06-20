import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import CategoryPage from "@/components/category/CategoryPage";
import { normalizeCategorySlug } from "@/lib/categorySlug";
import { loadCategoryProducts } from "@/lib/server/categoryPageLoader";
import { categoryPath } from "@/lib/routes";
import { getCategories, getCategoryBySlug } from "@/services/catalogService";
import { DEFAULT_FILTERS } from "@/types/filters";

export const dynamicParams = true;
export const revalidate = 60;

interface CategoryRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: CategoryRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  return {
    title: category.name,
    description: category.description,
  };
}

export default async function CategoryRoute({ params }: CategoryRouteProps) {
  const { slug } = await params;
  const [category, initialData] = await Promise.all([
    getCategoryBySlug(slug),
    loadCategoryProducts(slug, DEFAULT_FILTERS),
  ]);

  if (!category) {
    notFound();
  }

  if (normalizeCategorySlug(category.slug) !== normalizeCategorySlug(slug)) {
    redirect(categoryPath(category.slug));
  }

  return (
    <main className="storefront-page" id="main-content">
      <CategoryPage category={category} initialData={initialData} />
    </main>
  );
}
