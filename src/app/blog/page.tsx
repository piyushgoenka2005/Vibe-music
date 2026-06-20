import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { optimizeImageUrl } from "@/lib/images";
import { listPublicBlogPosts } from "@/lib/server/blogService";
import "./blog.css";

export const metadata: Metadata = {
  title: `Blog | ${SITE_NAME}`,
  description:
    "Guides, gear tips, and music industry insights from the Vibe Music team.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: `Blog | ${SITE_NAME}`,
    description:
      "Guides, gear tips, and music industry insights from the Vibe Music team.",
    url: `${SITE_URL}/blog`,
    type: "website",
  },
};

export default async function BlogIndexPage() {
  const rawPosts = await listPublicBlogPosts();
  const posts = Array.isArray(rawPosts) ? rawPosts : [];

  return (
    <main className="blog-page">
      <div className="blog-page__inner">
        <header className="blog-page__header">
          <p className="blog-page__eyebrow">InSync</p>
          <h1 className="blog-page__title">Blog</h1>
          <p className="blog-page__subtitle">
            Studio tips, buying guides, and stories from the world of music gear.
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="blog-page__empty">New articles are coming soon.</p>
        ) : (
          <div className="blog-grid">
            {posts.map((post) => (
              <article key={post.id} className="blog-card">
                <Link href={`/blog/${post.slug}`} className="blog-card__link">
                  {post.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={optimizeImageUrl(post.coverImage, "blogCover")}
                      alt=""
                      className="blog-card__image"
                      loading="lazy"
                    />
                  ) : (
                    <div className="blog-card__image blog-card__image--placeholder" />
                  )}
                  <div className="blog-card__body">
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
                    {post.excerpt ? (
                      <p className="blog-card__excerpt">{post.excerpt}</p>
                    ) : null}
                    <p className="blog-card__meta">
                      {post.authorName}
                      {post.publishedAt
                        ? ` · ${new Date(post.publishedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}`
                        : ""}
                    </p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
