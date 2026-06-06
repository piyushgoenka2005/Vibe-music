import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import HtmlSection from "@/components/sweetwater/HtmlSection";
import { BRAND } from "@/lib/brand";
import { ROUTES } from "@/lib/routes";
import { pageTitle } from "@/lib/site";

const HELP_PAGES: Record<
  string,
  { title: string; body: string[] }
> = {
  returns: {
    title: "Returns Policy",
    body: [
      "Most new items can be returned within 30 days of delivery for a refund or exchange.",
      "Items must be in original condition with all accessories and packaging.",
      "Contact our support team to start a return authorization.",
    ],
  },
  shipping: {
    title: "Shipping Information",
    body: [
      "Standard shipping typically arrives in 3–7 business days.",
      "Express options are available at checkout for eligible items.",
      "Tracking information is emailed once your order ships.",
    ],
  },
  ordering: {
    title: "Ordering Help",
    body: [
      "Browse our catalog, add items to your cart, and proceed to checkout.",
      "Sign in or create an account to save your order history.",
      "Need help choosing gear? Contact a Gear Advisor anytime.",
    ],
  },
  contact: {
    title: "Contact Us",
    body: [
      `Email: ${BRAND.email}`,
      `Phone: ${BRAND.phoneDisplay}`,
      "Hours: Monday–Friday, 9 AM – 6 PM IST",
    ],
  },
  accessibility: {
    title: "Accessibility Statement",
    body: [
      `${BRAND.name} is committed to providing an accessible shopping experience.`,
      "If you encounter accessibility barriers, please contact us and we will assist you.",
    ],
  },
};

interface HelpPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return Object.keys(HELP_PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: HelpPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = HELP_PAGES[slug];
  if (!page) return { title: pageTitle("Help") };
  return {
    title: pageTitle(page.title),
    description: page.body[0],
  };
}

export default async function HelpPage({ params }: HelpPageProps) {
  const { slug } = await params;
  const page = HELP_PAGES[slug];
  if (!page) notFound();

  return (
    <>
      <main className="homepage-wrapper" id="main-content">
        <article
          style={{ maxWidth: 760, margin: "0 auto", padding: "32px 16px", lineHeight: 1.6 }}
        >
          <h1 style={{ marginBottom: 16 }}>{page.title}</h1>
          {page.body.map((paragraph) => (
            <p key={paragraph} style={{ marginBottom: 12 }}>
              {paragraph}
            </p>
          ))}
          <p style={{ marginTop: 24 }}>
            <Link href={ROUTES.privacy}>Privacy Policy</Link>
            {" · "}
            <Link href={ROUTES.terms}>Terms of Service</Link>
          </p>
        </article>
      </main>
      <HtmlSection file="footer" />
    </>
  );
}
