import HtmlSection from "@/components/sweetwater/HtmlSection";
import SearchResultsPage from "@/components/search/SearchResultsPage";

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

  return (
    <>
      <main className="homepage-wrapper" id="main-content">
        <SearchResultsPage
          query={query}
          initialCategory={params.category ?? ""}
          initialBrand={params.brand ?? ""}
        />
      </main>
      <HtmlSection file="footer" />
    </>
  );
}
