import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { isProductionBuildPhase } from "@/lib/db/postgresConfig";
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
import { BRAND } from "@/lib/brand";

export const dynamicParams = true;
export const revalidate = 60;

interface CategoryRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  if (process.env.NODE_ENV === "development") {
    return [];
  }
  if (isProductionBuildPhase() && process.env.ALLOW_POSTGRES_DURING_BUILD !== "true") {
    return [];
  }
  try {
    const categories = await getCategoryCatalog();
    return collectCategoryRouteSlugs(categories).map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: CategoryRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await resolveCategoryBySlug(slug);
  if (!category) {
    return {
      title: "Category not found | Vibe Music",
      robots: { index: false, follow: false },
    };
  }

  const title = `${category.name} | Vibe Music`;
  const description =
    category.description?.trim() ||
    `Explore premium ${category.name} at Vibe Music. Authentic instruments, pro gear, authorized brand warranties, and fast free delivery across India.`;
  const canonicalUrl = `${BRAND.siteUrl}${categoryPath(category.slug)}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: BRAND.name,
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
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
