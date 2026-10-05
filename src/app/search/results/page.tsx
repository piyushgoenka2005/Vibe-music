import type { Metadata } from "next";
import SearchResultsPage from "@/components/search/SearchResultsPage";
import { getSearchResults, SEARCH_MIN_QUERY_LENGTH } from "@/lib/server/searchResultsService";
import type { SearchResultsData } from "@/types/search";

export const revalidate = 60;

export const metadata: Metadata = {
  robots: { index: false, follow: true },
  alternates: { canonical: "/search" },
};

interface SearchResultsRouteProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    subcategory?: string;
    brand?: string;
  }>;
}

export default async function SearchResultsRoute({ searchParams }: SearchResultsRouteProps) {
  const params = await searchParams;
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
