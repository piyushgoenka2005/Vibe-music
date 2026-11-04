import { Suspense } from "react";
import type { Metadata } from "next";
import ContactPageContent from "@/components/contact/ContactPageContent";
import { BRAND } from "@/lib/brand";
import { resolvePublicLegal } from "@/lib/brand/resolvePublicLegal";
import "@/styles/contact-page.css";

export const revalidate = 300;

export const metadata: Metadata = {
  title: `Contact Us | ${BRAND.name}`,
  description: "Get in touch with Vibe Music for orders, product advice, and support.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: `Contact Us | ${BRAND.name}`,
    description: "Get in touch with Vibe Music for orders, product advice, and support.",
    url: `${BRAND.siteUrl}/contact`,
    siteName: BRAND.name,
    locale: "en_IN",
    type: "website",
  },
};

export default async function ContactPage() {
  const legal = await resolvePublicLegal();

  return (
    <main className="storefront-page storefront-page--subtle">
      <Suspense
        fallback={
          <div className="storefront-page__inner contact-page">
            <div className="contact-page__submit">Send message</div>
          </div>
        }
      >
        <ContactPageContent legal={legal} />
      </Suspense>
    </main>
  );
}
