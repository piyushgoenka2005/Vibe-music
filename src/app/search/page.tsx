import { redirect } from "next/navigation";
import type { Metadata } from "next";
import SearchLandingExperience from "@/components/search/SearchLandingExperience";
import SearchRecentlyViewed from "@/components/search/SearchRecentlyViewed";
import StorefrontBackButton from "@/components/layout/StorefrontBackButton";
import { BRAND } from "@/lib/brand";
import { resolveSearchPageRedirect } from "@/lib/seo/adLanding";
import "@/components/search/search.css";

export const revalidate = 60;

export const metadata: Metadata = {
  title: `Search | ${BRAND.name}`,
  description: "Find instruments, pro audio, software, and accessories at Vibe Music.",
  alternates: { canonical: "/search" },
};

interface SearchPageProps {
  searchParams: Promise<{ brand?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const redirectTarget = resolveSearchPageRedirect(params);
  if (redirectTarget) {
    redirect(redirectTarget);
  }

  return (
    <main className="storefront-page storefront-page--subtle">
      <div className="sw-search-landing-shell">
        <section className="sw-search-landing">
          <StorefrontBackButton />
          <p className="sw-search-landing__eyebrow">Gear discovery</p>
          <h1>Search Vibe Music</h1>
          <p className="sw-search-landing__lead">
            Find instruments, pro audio, software, and more — start typing or pick a category below.
          </p>
          <SearchLandingExperience autoFocus />
        </section>
        <div className="sw-search-landing-recent">
          <SearchRecentlyViewed />
        </div>
      </div>
    </main>
  );
}
