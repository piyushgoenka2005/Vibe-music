import { notFound } from "next/navigation";
import CategoryPage from "@/components/category/CategoryPage";
import { getCategories, getCategoryBySlug } from "@/services/catalogService";

interface CategoryRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export default async function CategoryRoute({ params }: CategoryRouteProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  return (
    <main className="storefront-page" id="main-content">
      <CategoryPage category={category} />
    </main>
  );
}
