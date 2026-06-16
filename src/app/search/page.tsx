import SearchBar from "@/components/search/SearchBar";
import "@/components/search/search.css";

export default function SearchPage() {
  return (
    <main className="storefront-page storefront-page--subtle" id="main-content">
      <section className="sw-search-landing">
        <h1>Search Vibe Music</h1>
        <p className="sw-search-landing__lead">
          Find instruments, pro audio, software, and more.
        </p>
        <SearchBar autoFocus />
      </section>
    </main>
  );
}
