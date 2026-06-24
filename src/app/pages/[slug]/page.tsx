import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getContentPage, CONTENT_PAGE_SLUGS } from "@/data/contentPages";
import { ROUTES } from "@/lib/routes";

export const dynamicParams = false;

interface ContentPageRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return CONTENT_PAGE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ContentPageRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getContentPage(slug);
  if (!page) return {};
  return { title: page.title, description: page.sections[0]?.paragraphs[0] };
}

export default async function ContentPageRoute({ params }: ContentPageRouteProps) {
  const { slug } = await params;
  const page = getContentPage(slug);
  if (!page) notFound();

  return (
    <main className="storefront-page storefront-page--subtle">
      <article className="storefront-page__header" style={{ maxWidth: "48rem", margin: "0 auto" }}>
        <p className="storefront-page__eyebrow">{page.eyebrow}</p>
        <h1 className="storefront-page__title">{page.title}</h1>
        <div style={{ marginTop: "2rem", lineHeight: 1.7 }}>
          {page.sections.map((section, index) => (
            <section key={index} style={{ marginBottom: "1.75rem" }}>
              {section.heading ? (
                <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                  {section.heading}
                </h2>
              ) : null}
              {section.paragraphs.map((paragraph, pIndex) => (
                <p key={pIndex} style={{ marginBottom: "0.75rem", color: "var(--color-text-muted, #666)" }}>
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
        <p style={{ marginTop: "2rem" }}>
          <Link href={ROUTES.home}>← Back to home</Link>
        </p>
      </article>
    </main>
  );
}
