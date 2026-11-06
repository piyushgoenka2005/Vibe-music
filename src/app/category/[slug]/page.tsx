import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import CategoryPage from "@/components/category/CategoryPage";
import { loadCategoryProducts } from "@/lib/server/categoryPageLoader";
import {
  getCategoryCatalog,
  isCanonicalCategorySlug,
  resolveCategoryBySlug,
} from "@/lib/server/categoryResolver";
import { categoryPath } from "@/lib/routes";
import { withServerPageError } from "@/lib/serverPageError";
import { DEFAULT_FILTERS } from "@/types/filters";
import { BRAND } from "@/lib/brand";
import { slugify } from "@/lib/slug";

export const dynamicParams = true;
export const revalidate = 60;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const { getCategoryCatalog } = await import("@/lib/server/categoryResolver");
    const categories = await getCategoryCatalog();
    return categories.map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

interface CategoryRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryRouteProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const category = await resolveCategoryBySlug(slug);
    if (!category) {
      notFound();
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
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      (("digest" in error &&
        typeof (error as { digest?: unknown }).digest === "string" &&
        (error as { digest: string }).digest.startsWith("NEXT_")) ||
        ("message" in error &&
          typeof (error as { message?: unknown }).message === "string" &&
          (error as { message: string }).message.startsWith("NEXT_")))
    ) {
      throw error;
    }
    console.error("[category:generateMetadata] error generating category metadata", error);
    return {
      title: "Category | Vibe Music",
      robots: { index: false, follow: false },
    };
  }
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

  return withServerPageError(async () => {
    // Resolve parent category if this is a child category
    const categories = category.parentId ? await getCategoryCatalog() : undefined;
    const parentCategory = categories?.find((candidate) => candidate.id === category.parentId);

    // Product records keep the department in `categorySlug` and the leaf
    // taxonomy value in `subcategory`. Resolve leaf routes back to their
    // department before querying, otherwise `/category/<child>` can never
    // match products whose category is the parent department.
    const listingCategory = category.parentId
      ? categories?.find((candidate) => candidate.id === category.parentId)
      : category;
    const childFilters = {
      ...DEFAULT_FILTERS,
      subcategories: [category.slug, slugify(category.name)].filter(Boolean),
    };

    // FIX: For subcategories, use the parent category slug with subcategory filters
    const initialData = await loadCategoryProducts(
      listingCategory?.slug ?? category.slug,
      category.parentId ? childFilters : DEFAULT_FILTERS,
    );

    return (
      <main className="storefront-page">
        <CategoryPage
          category={category}
          parentCategory={parentCategory}
          initialData={initialData}
        />
      </main>
    );
  }, "Category");
}
