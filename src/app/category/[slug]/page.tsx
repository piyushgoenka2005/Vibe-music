import { notFound } from "next/navigation";
import type { Metadata } from "next";
import HtmlSection from "@/components/sweetwater/HtmlSection";
import CategoryPage from "@/components/category/CategoryPage";
import { getCategoryBySlug } from "@/data/categories";
import { pageTitle } from "@/lib/site";

export const revalidate = 60;

interface CategoryRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryRouteProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return { title: pageTitle("Category") };
  return {
    title: pageTitle(category.name),
    description: category.description,
  };
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
