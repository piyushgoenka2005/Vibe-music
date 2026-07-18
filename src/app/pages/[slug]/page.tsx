import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import StorefrontBackButton from "@/components/layout/StorefrontBackButton";
import { resolveContentPage } from "@/lib/server/contentPageRepository";
import { CONTENT_PAGE_SLUGS } from "@/data/contentPages";
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
  const page = await resolveContentPage(slug);
  if (!page) return {};
  return { title: page.title, description: page.sections[0]?.paragraphs[0] };
}

export default async function ContentPageRoute({ params }: ContentPageRouteProps) {
  const { slug } = await params;
  const page = await resolveContentPage(slug);
  if (!page) notFound();

  return (
    <main className="storefront-page storefront-page--subtle cms-page">
      <article className="storefront-page__inner cms-page__article">
        <header className="storefront-page__header cms-page__header">
          <StorefrontBackButton />
          <p className="storefront-page__eyebrow">{page.eyebrow}</p>
          <h1 className="storefront-page__title">{page.title}</h1>
        </header>
        <div className="cms-page__content">
          {page.sections.map((section, index) => (
            <section key={index} className="cms-page__section">
              {section.heading ? (
                <h2 className="cms-page__section-title">{section.heading}</h2>
              ) : null}
              {section.paragraphs.map((paragraph, pIndex) => (
                <p key={pIndex} className="cms-page__paragraph">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
        <p className="cms-page__back">
          <Link href={ROUTES.home}>← Back to home</Link>
        </p>
      </article>
    </main>
  );
}
