import Link from "next/link";
import { listPublicBlogPosts } from "@/lib/server/blogService";
import { optimizeImageUrl } from "@/lib/images";
import { ROUTES } from "@/lib/routes";
import SECTION_CTA_ARROW from "@/components/homepage/SectionCtaArrow";
import Reveal from "@/components/layout/Reveal";
import type { BlogPostSummary } from "@/types/blog";

const HEADLINE_ID = "blog-teaser-title";

function formatPublishedDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function BlogTeaserCard({
  post,
  featured = false,
}: {
  post: BlogPostSummary;
  featured?: boolean;
}) {
  const published = formatPublishedDate(post.publishedAt);

  return (
    <article
      className={`blog-teaser__card${featured ? " blog-teaser__card--featured" : ""}`}
    >
      <Link
        className="blog-teaser__link"
        href={`${ROUTES.blog}/${post.slug}`}
      >
        <div className="blog-teaser__media">
          {post.coverImage ? (
            <img
              alt=""
              className="blog-teaser__image"
              loading="lazy"
              src={optimizeImageUrl(post.coverImage, "blogCover")}
            />
          ) : (
            <div className="blog-teaser__image blog-teaser__image--placeholder" />
          )}
        </div>
        <div className="blog-teaser__body">
          {post.tags.length > 0 ? (
            <div className="blog-teaser__tags">
              {post.tags.slice(0, 2).map((tag) => (
                <span className="blog-teaser__tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          <h3 className="blog-teaser__post-title">{post.title}</h3>
          {post.excerpt ? (
            <p className="blog-teaser__excerpt">{post.excerpt}</p>
          ) : null}
          <div className="blog-teaser__footer">
            <p className="blog-teaser__meta">
              {post.authorName}
              {published ? ` · ${published}` : ""}
            </p>
            <span className="blog-teaser__read">
              Read article
              <span aria-hidden="true"> →</span>
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default async function HomepageBlogTeaser() {
  let posts: BlogPostSummary[] = [];

  try {
    const allPosts = await listPublicBlogPosts();
    posts = Array.isArray(allPosts) ? allPosts.slice(0, 3) : [];
  } catch (error) {
    console.warn(
      "[home] Blog teaser unavailable:",
      error instanceof Error ? error.message : error
    );
  }

  if (!Array.isArray(posts) || posts.length === 0) return null;

  const gridModifier =
    posts.length === 1 ? "one" : posts.length === 2 ? "two" : "three";

  return (
    <Reveal as="section" className="blog-teaser" aria-labelledby={HEADLINE_ID}>
      <div className="blog-teaser__inner">
        <header className="blog-teaser__header">
          <div className="blog-teaser__header-copy">
            <p className="blog-teaser__eyebrow">Guides &amp; stories</p>
            <h2 className="blog-teaser__title" id={HEADLINE_ID}>
              Learn before you buy
            </h2>
            <p className="blog-teaser__subtitle">
              Studio tips, buying guides, and stories from the world of music
              gear.
            </p>
          </div>
          <Link
            className="homepage-section__cta-btn blog-teaser__all"
            href={ROUTES.blog}
          >
            View all articles
            {SECTION_CTA_ARROW}
          </Link>
        </header>

        <div className={`blog-teaser__grid blog-teaser__grid--${gridModifier}`}>
          {posts.map((post, index) => (
            <Reveal
              key={post.id}
              className="blog-teaser__card-wrap"
              delay={index * 80}
            >
              <BlogTeaserCard
                featured={posts.length === 1}
                post={post}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
