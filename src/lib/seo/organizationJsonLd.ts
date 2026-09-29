import { BRAND } from "@/lib/brand";
import { SOCIAL_LINKS } from "@/lib/socialLinks";

/** Organization + WebSite JSON-LD for Google Search Console / rich results. */
export function buildOrganizationWebsiteJsonLd() {
  const logoUrl = new URL(BRAND.logoPath, BRAND.siteUrl).toString();

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${BRAND.siteUrl}/#organization`,
        name: BRAND.name,
        url: BRAND.siteUrl,
        logo: {
          "@type": "ImageObject",
          url: logoUrl,
        },
        email: BRAND.email,
        ...(BRAND.phoneTel ? { telephone: BRAND.phoneTel } : {}),
        address: {
          "@type": "PostalAddress",
          streetAddress:
            "Sikkim Commerce House, 4/1 Middleton Street, 3rd Floor, Room 303, Kolkata – 700071",
          addressLocality: "Kolkata",
          postalCode: "700071",
          addressRegion: "WB",
          addressCountry: "IN",
        },
        sameAs: [
          SOCIAL_LINKS.facebook,
          SOCIAL_LINKS.twitter,
          SOCIAL_LINKS.instagram,
          SOCIAL_LINKS.linkedin,
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${BRAND.siteUrl}/#website`,
        url: BRAND.siteUrl,
        name: BRAND.name,
        description: BRAND.description,
        publisher: { "@id": `${BRAND.siteUrl}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${BRAND.siteUrl}/search/results?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}
