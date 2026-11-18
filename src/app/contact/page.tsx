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

export default async function ContactPage({
  searchParams,
}: {
  searchParams?: Promise<{ subject?: string; body?: string }>;
}) {
  const [legal, resolvedParams] = await Promise.all([
    resolvePublicLegal(),
    searchParams
      ? searchParams.catch((): { subject?: string; body?: string } => ({}))
      : Promise.resolve<{ subject?: string; body?: string }>({}),
  ]);

  const initialSubject =
    typeof resolvedParams.subject === "string" ? resolvedParams.subject.trim().slice(0, 160) : "";
  const initialBody =
    typeof resolvedParams.body === "string" ? resolvedParams.body.trim().slice(0, 4000) : "";

  return (
    <main className="storefront-page storefront-page--subtle">
      <ContactPageContent legal={legal} initialSubject={initialSubject} initialBody={initialBody} />
    </main>
  );
}
