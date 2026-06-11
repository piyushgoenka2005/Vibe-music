import SearchBar from "@/components/search/SearchBar";
import "@/components/search/search.css";

export default function SearchPage() {
  return (
    <main className="homepage-wrapper" id="main-content">
      <section className="sw-search-landing">
        <h1>Search Vibe Music</h1>
        <p style={{ margin: "0 0 20px", color: "#807f7e" }}>
          Find instruments, pro audio, software, and more.
        </p>
        <SearchBar autoFocus />
      </section>
    </main>
  );
}
