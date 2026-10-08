import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import StorefrontBackButton from "@/components/layout/StorefrontBackButton";
import { listContentPages, resolveContentPage } from "@/lib/server/contentPageRepository";
import { withServerPageError } from "@/lib/serverPageError";
import { CONTENT_PAGE_SLUGS } from "@/data/contentPages";
import { ROUTES } from "@/lib/routes";
import "@/styles/cms-page.css";

export const dynamicParams = true;

const RELATED_POLICY_PAGES = [
  { slug: "shipping", label: "Shipping & Delivery" },
  { slug: "returns", label: "Returns & Exchanges" },
  { slug: "privacy", label: "Privacy Policy" },
  { slug: "terms", label: "Terms & Conditions" },
  { slug: "cookies", label: "Cookie Policy" },
] as const;

interface ContentPageRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const pages = await listContentPages();
    const slugs = new Set([...CONTENT_PAGE_SLUGS, ...pages.map((page) => page.slug)]);
    return [...slugs].map((slug) => ({ slug }));
  } catch {
    return CONTENT_PAGE_SLUGS.map((slug) => ({ slug }));
  }
}

export async function generateMetadata({ params }: ContentPageRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await resolveContentPage(slug);
  if (!page) return {};
  return { title: page.title, description: page.sections[0]?.paragraphs[0] };
}

function splitIntroSection(sections: Array<{ heading?: string; paragraphs: string[] }>) {
  const first = sections[0];
  const isIntroOnly =
    Boolean(first) && !first.heading && first.paragraphs.length === 1 && first.paragraphs[0];

  return {
    lede: isIntroOnly ? first.paragraphs[0] : null,
    bodySections: isIntroOnly ? sections.slice(1) : sections,
  };
}

export default async function ContentPageRoute({ params }: ContentPageRouteProps) {
  return withServerPageError(async () => {
    const { slug } = await params;
    const page = await resolveContentPage(slug);
    if (!page) notFound();

    const { lede, bodySections } = splitIntroSection(page.sections);
    const showRelated = RELATED_POLICY_PAGES.some((item) => item.slug === slug);

    return (
      <main className="storefront-page storefront-page--subtle cms-page">
        <article className="storefront-page__inner cms-page__article">
          <header className="storefront-page__header cms-page__header">
            <StorefrontBackButton />
            <p className="storefront-page__eyebrow">{page.eyebrow}</p>
            <h1 className="storefront-page__title">{page.title}</h1>
            {lede ? <p className="cms-page__lede">{lede}</p> : null}
          </header>

          <div className="cms-page__panel">
            <div className="cms-page__content">
              {bodySections.map((section, index) => (
                <section key={index} className="cms-page__section">
                  {section.heading ? (
                    <h2 className="cms-page__section-title">{section.heading}</h2>
                  ) : null}
                  {section.paragraphs.map((paragraph, pIndex) =>
                    /<[a-z][\s\S]*>/i.test(paragraph) ? (
                      <div
                        key={pIndex}
                        className="cms-page__paragraph cms-page__richtext"
                        dangerouslySetInnerHTML={{ __html: paragraph }}
                      />
                    ) : (
                      <p key={pIndex} className="cms-page__paragraph">
                        {paragraph}
                      </p>
                    ),
                  )}
                </section>
              ))}
            </div>
          </div>

          <footer className="cms-page__footer">
            {showRelated ? (
              <nav className="cms-page__related" aria-label="Related policies">
                <p className="cms-page__related-label">Related policies</p>
                <ul className="cms-page__related-list">
                  {RELATED_POLICY_PAGES.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={ROUTES.page(item.slug)}
                        className={`cms-page__related-link${item.slug === slug ? " is-active" : ""}`}
                        aria-current={item.slug === slug ? "page" : undefined}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
            <p className="cms-page__back">
              <Link href={ROUTES.home}>← Back to home</Link>
            </p>
          </footer>
        </article>
      </main>
    );
  }, "Page");
}
