import SearchLandingExperience from "@/components/search/SearchLandingExperience";
import "@/components/search/search.css";

export default function SearchPage() {
  return (
    <main className="storefront-page storefront-page--subtle">
      <div className="sw-search-landing-shell">
        <section className="sw-search-landing">
          <p className="sw-search-landing__eyebrow">Gear discovery</p>
          <h1>Search Vibe Music</h1>
          <p className="sw-search-landing__lead">
            Find instruments, pro audio, software, and more — start typing or pick a
            category below.
          </p>
          <SearchLandingExperience autoFocus />
        </section>
      </div>
    </main>
  );
}
