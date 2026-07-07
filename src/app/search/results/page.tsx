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
    brand?: string;
  }>;
}

export default async function SearchResultsRoute({
  searchParams,
}: SearchResultsRouteProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const category = params.category ?? "";
  const brand = params.brand ?? "";

  let initialResults: SearchResultsData | null = null;
  const hasFilter = Boolean(category || brand);

  if (query.length >= SEARCH_MIN_QUERY_LENGTH || hasFilter) {
    try {
      initialResults = await getSearchResults({ query, category, brand });
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
        initialBrand={brand}
        initialResults={initialResults}
      />
    </main>
  );
}
