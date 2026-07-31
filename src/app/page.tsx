import type { Metadata } from "next";
import HomePage from "@/components/home/HomePage";
import { BRAND } from "@/lib/brand";
import { buildOrganizationWebsiteJsonLd } from "@/lib/seo/organizationJsonLd";

/** Cache rendered homepage HTML for 60s — faster repeat visits in production. */
export const revalidate = 60;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    url: BRAND.siteUrl,
  },
};

export default function Home() {
  const jsonLd = buildOrganizationWebsiteJsonLd();

  // LCP image priority is set on HomepageBannerHero via next/image —
  // avoid a second raw preload that races the optimized `/_next/image` URL.
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomePage />
    </>
  );
}
