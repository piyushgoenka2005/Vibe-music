import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_CATEGORIES } from "@/lib/blog/blogEngine";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { optimizeImageUrl } from "@/lib/images";
import { listPublicBlogPostsPaginated } from "@/lib/server/blogService";
import { withServerPageError } from "@/lib/serverPageError";
import "./blog.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Blog | ${SITE_NAME}`,
  description: "Guides, gear tips, and music industry insights from the Vibe Music team.",
  alternates: {
    canonical: "/blog",
    types: {
      "application/rss+xml": `${SITE_URL}/blog/rss.xml`,
    },
  },
  openGraph: {
    title: `Blog | ${SITE_NAME}`,
    description: "Guides, gear tips, and music industry insights from the Vibe Music team.",
    url: `${SITE_URL}/blog`,
    type: "website",
  },
};

type PageProps = {
  searchParams: Promise<{ page?: string; q?: string; category?: string }>;
};

function buildPageHref(page: number, params: { q?: string; category?: string }): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.category) search.set("category", params.category);
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `/blog?${query}` : "/blog";
}

export default async function BlogIndexPage({ searchParams }: PageProps) {
  return withServerPageError(async () => {
    const params = await searchParams;
    const page = Math.max(1, Number(params.page ?? "1") || 1);
    const q = params.q?.trim() || undefined;
    const category = params.category?.trim() || undefined;

    const result = await listPublicBlogPostsPaginated({
      page,
      q,
      category,
    });

    return (
      <main className="blog-page">
        <div className="blog-page__inner">
          <header className="blog-page__header">
            <p className="blog-page__eyebrow">InSync</p>
            <h1 className="blog-page__title">Blog</h1>
            <p className="blog-page__subtitle">
              Studio tips, buying guides, and stories from the world of music gear.
            </p>
            <div className="blog-page__toolbar">
              <form className="blog-page__search" action="/blog" method="get">
                {category ? <input type="hidden" name="category" value={category} /> : null}
                <label className="blog-page__search-label" htmlFor="blog-search">
                  Search articles
                </label>
                <input
                  id="blog-search"
                  name="q"
                  defaultValue={q ?? ""}
                  placeholder="Search guides, tags, authors…"
                />
                <button type="submit">Search</button>
              </form>
              <Link href="/blog/rss.xml" className="blog-page__rss">
                RSS feed
              </Link>
            </div>
            <nav className="blog-page__categories" aria-label="Blog categories">
              <Link
                href="/blog"
                className={`blog-page__category${!category ? " blog-page__category--active" : ""}`}
              >
                All
              </Link>
              {BLOG_CATEGORIES.map((item) => (
                <Link
                  key={item.slug}
                  href={`/blog?category=${item.slug}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                  className={`blog-page__category${
                    category === item.slug ? " blog-page__category--active" : ""
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>

          {result.posts.length === 0 ? (
            <p className="blog-page__empty">No articles match your filters yet.</p>
          ) : (
            <>
              <div className="blog-grid">
                {result.posts.map((post) => (
                  <article key={post.id} className="blog-card">
                    <Link href={`/blog/${post.slug}`} className="blog-card__link">
                      {post.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={optimizeImageUrl(post.coverImage, "blogCover")}
                          alt={post.title}
                          className="blog-card__image"
                          loading="lazy"
                        />
                      ) : (
                        <div className="blog-card__image blog-card__image--placeholder" />
                      )}
                      <div className="blog-card__body">
                        <div className="blog-card__meta-row">
                          {post.categoryLabel ? (
                            <span className="blog-card__category">{post.categoryLabel}</span>
                          ) : null}
                          {post.featured ? (
                            <span className="blog-card__featured">Featured</span>
                          ) : null}
                        </div>
                        {post.tags.length > 0 ? (
                          <div className="blog-card__tags">
                            {post.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="blog-card__tag">
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <h2 className="blog-card__title">{post.title}</h2>
                        {post.excerpt ? <p className="blog-card__excerpt">{post.excerpt}</p> : null}
                        <p className="blog-card__meta">
                          {post.authorName}
                          {post.publishedAt
                            ? ` · ${new Date(post.publishedAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}`
                            : ""}
                          {post.readingMinutes ? ` · ${post.readingMinutes} min read` : ""}
                        </p>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>

              {result.totalPages > 1 ? (
                <nav className="blog-pagination" aria-label="Blog pagination">
                  {page > 1 ? (
                    <Link href={buildPageHref(page - 1, { q, category })}>Previous</Link>
                  ) : null}
                  <span>
                    Page {result.page} of {result.totalPages}
                  </span>
                  {page < result.totalPages ? (
                    <Link href={buildPageHref(page + 1, { q, category })}>Next</Link>
                  ) : null}
                </nav>
              ) : null}
            </>
          )}
        </div>
      </main>
    );
  }, "Blog");
}
