import SearchResultsPage from "@/components/search/SearchResultsPage";
import {
  getSearchResults,
  SEARCH_MIN_QUERY_LENGTH,
} from "@/lib/server/searchResultsService";
import type { SearchResultsData } from "@/types/search";

interface SearchResultsRouteProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    subcategory?: string;
  }>;
}

export default async function SearchResultsRoute({
  searchParams,
}: SearchResultsRouteProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const category = params.category ?? "";
  const subcategory = params.subcategory ?? "";

  let initialResults: SearchResultsData | null = null;
  const hasFilter = Boolean(category || subcategory);

  if (query.length >= SEARCH_MIN_QUERY_LENGTH || hasFilter) {
    try {
      // Fetch full match set; brand/price/rating filters apply client-side.
      initialResults = await getSearchResults({ query, category, subcategory });
    } catch {
      // Fall back to client-side fetching if the server lookup fails.
      initialResults = null;
    }
  }

  return (
    <main className="storefront-page storefront-page--subtle">
      <SearchResultsPage
        query={query}
        initialCategory={category}
        initialSubcategory={subcategory}
        initialResults={initialResults}
      />
    </main>
  );
}
