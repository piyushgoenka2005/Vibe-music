import { notFound } from "next/navigation";
import HtmlSection from "@/components/vibe/HtmlSection";
import CategoryPage from "@/components/category/CategoryPage";
import { getCategoryBySlug } from "@/data/categories";

interface CategoryRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const { CATEGORIES } = await import("@/data/categories");
  return CATEGORIES.map((category) => ({ slug: category.slug }));
}

export default async function CategoryRoute({ params }: CategoryRouteProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  return (
    <>
      <main className="homepage-wrapper" id="main-content">
        <CategoryPage category={category} />
      </main>
      <HtmlSection file="footer" />
    </>
  );
}
