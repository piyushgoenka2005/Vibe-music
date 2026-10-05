import { redirect } from "next/navigation";
import type { Metadata } from "next";
import SearchResultsPage from "@/components/search/SearchResultsPage";
import { BRAND } from "@/lib/brand";
import {
  buildSearchQueryMetadata,
  resolveSearchResultsRedirect,
  type SearchLandingParams,
} from "@/lib/seo/adLanding";
import { cdnSeoImageUrl } from "@/lib/storefrontImages";
import { getSearchResults, SEARCH_MIN_QUERY_LENGTH } from "@/lib/server/searchResultsService";
import type { SearchResultsData } from "@/types/search";

export const revalidate = 60;

interface SearchResultsRouteProps {
  searchParams: Promise<SearchLandingParams>;
}

export async function generateMetadata({
  searchParams,
}: SearchResultsRouteProps): Promise<Metadata> {
  const params = await searchParams;
  const redirectTarget = resolveSearchResultsRedirect(params);
  if (redirectTarget) {
    return { robots: { index: false, follow: true } };
  }

  const query = params.q?.trim() ?? "";
  if (query.length >= SEARCH_MIN_QUERY_LENGTH) {
    try {
      const results = await getSearchResults({ query });
      const hero = results.products[0]?.image;
      return buildSearchQueryMetadata(query, {
        productCount: results.total,
        imageUrl: hero ? cdnSeoImageUrl(hero) : undefined,
      });
    } catch {
      return buildSearchQueryMetadata(query);
    }
  }

  return {
    title: `Search | ${BRAND.name}`,
    robots: { index: false, follow: true },
    alternates: { canonical: "/search" },
  };
}

export default async function SearchResultsRoute({ searchParams }: SearchResultsRouteProps) {
  const params = await searchParams;
  const redirectTarget = resolveSearchResultsRedirect(params);
  if (redirectTarget) {
    redirect(redirectTarget);
  }

  const query = params.q?.trim() ?? "";
  const category = params.category ?? "";
  const subcategory = params.subcategory ?? "";
  const brand = params.brand?.split(",")[0]?.trim() ?? "";

  let initialResults: SearchResultsData | null = null;
  const hasFilter = Boolean(category || subcategory || brand);

  if (query.length >= SEARCH_MIN_QUERY_LENGTH || hasFilter) {
    try {
      initialResults = await getSearchResults({
        query,
        category: category || undefined,
        subcategory: subcategory || undefined,
        brand: brand || undefined,
      });
    } catch {
      initialResults = null;
    }
  }

  return (
    <main className="storefront-page storefront-page--subtle">
      <SearchResultsPage
        query={query}
        initialCategory={category}
        initialSubcategory={subcategory}
        initialBrand={brand}
        initialResults={initialResults}
      />
    </main>
  );
}
