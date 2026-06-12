import { notFound } from "next/navigation";
import HtmlSection from "@/components/vibe/HtmlSection";
import CategoryPage from "@/components/category/CategoryPage";
import { getCategories, getCategoryBySlug } from "@/services/catalogService";

interface CategoryRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getCategories().map((category) => ({ slug: category.slug }));
}

export default async function CategoryRoute({ params }: CategoryRouteProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  return (
    <>
      <HtmlSection file="header" />
      <main className="homepage-wrapper" id="main-content">
        <CategoryPage category={category} />
      </main>
      <HtmlSection file="footer" />
    </>
  );
}
