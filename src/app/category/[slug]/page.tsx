import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { isProductionBuildPhase } from "@/lib/db/postgresConfig";
import CategoryPage from "@/components/category/CategoryPage";
import { collectCategoryRouteSlugs } from "@/lib/categorySlug";
import { loadCategoryProducts } from "@/lib/server/categoryPageLoader";
import { resolveBrandBySlug } from "@/lib/server/brandsPageLoader";
import {
  getCategoryCatalog,
  isCanonicalCategorySlug,
  resolveCategoryBySlug,
} from "@/lib/server/categoryResolver";
import { buildCategoryFilteredMetadata } from "@/lib/seo/adLanding";
import { cdnSeoImageUrl } from "@/lib/storefrontImages";
import { categoryPath } from "@/lib/routes";
import { DEFAULT_FILTERS } from "@/types/filters";
import { BRAND } from "@/lib/brand";

export const dynamicParams = true;
export const revalidate = 60;

interface CategoryRouteProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ brand?: string; subcat?: string }>;
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

export async function generateMetadata({
  params,
  searchParams,
}: CategoryRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const filters = await searchParams;
  const category = await resolveCategoryBySlug(slug);
  if (!category) {
    return {
      title: "Category not found | Vibe Music",
      robots: { index: false, follow: false },
    };
  }

  const brandSlug = filters.brand?.split(",")[0]?.trim() ?? "";
  const subcategory = filters.subcat?.split(",")[0]?.trim() ?? "";
  const brand = brandSlug ? await resolveBrandBySlug(brandSlug) : null;

  if (brandSlug || subcategory) {
    let productCount: number | undefined;
    let imageUrl: string | undefined;
    try {
      const listing = await loadCategoryProducts(category.slug, {
        ...DEFAULT_FILTERS,
        brands: brandSlug ? [brandSlug] : [],
        subcategories: subcategory ? [subcategory] : [],
      });
      productCount = listing.total;
      const hero = listing.products[0]?.image;
      imageUrl = hero
        ? cdnSeoImageUrl(hero)
        : brand?.logoUrl
          ? `${BRAND.siteUrl}${brand.logoUrl}`
          : undefined;
    } catch {
      imageUrl = brand?.logoUrl ? `${BRAND.siteUrl}${brand.logoUrl}` : undefined;
    }

    const searchParamsRecord: Record<string, string> = {};
    if (brandSlug) searchParamsRecord.brand = brandSlug;
    if (subcategory) searchParamsRecord.subcat = subcategory;

    return buildCategoryFilteredMetadata({
      categoryName: category.name,
      categorySlug: category.slug,
      brandName: brand?.name,
      brandSlug: brand?.slug,
      subcategoryRaw: subcategory,
      productCount,
      imageUrl,
      searchParams: searchParamsRecord,
    });
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
