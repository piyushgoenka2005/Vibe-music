import { notFound } from "next/navigation";
import CategoryPage from "@/components/category/CategoryPage";
import { loadCategoryProducts } from "@/lib/server/categoryPageLoader";
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

export default async function CategoryRoute({ params }: CategoryRouteProps) {
  const { slug } = await params;
  const [category, initialData] = await Promise.all([
    getCategoryBySlug(slug),
    loadCategoryProducts(slug, DEFAULT_FILTERS),
  ]);

  if (!category) {
    notFound();
  }

  return (
    <main className="storefront-page">
      <CategoryPage category={category} initialData={initialData} />
    </main>
  );
}
