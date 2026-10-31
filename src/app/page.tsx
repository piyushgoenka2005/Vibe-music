import type { Metadata } from "next";
import HomePage from "@/components/home/HomePage";
import { BRAND } from "@/lib/brand";
import { buildOrganizationWebsiteJsonLd } from "@/lib/seo/organizationJsonLd";

/** Cache rendered homepage HTML for 30s — fast repeat visits in production, immediately revalidated on admin updates. */
export const revalidate = 30;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    url: BRAND.siteUrl,
  },
};

export default function Home() {
  const jsonLd = buildOrganizationWebsiteJsonLd();

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        id="vibe-org-website-jsonld"
        type="application/ld+json"
      />
      <HomePage />
    </>
  );
}
