import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BlogCommentSection from "@/components/blog/BlogCommentSection";
import BlogNewsletterCta from "@/components/blog/BlogNewsletterCta";
import BlogShareBar from "@/components/blog/BlogShareBar";
import { computeReadingMinutes } from "@/lib/blog/blogEngine";
import { renderBlogContentHtml } from "@/lib/blog/render";
import { optimizeImageUrl } from "@/lib/images";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import {
  getPublicBlogPostBySlug,
  getRelatedPublicPosts,
  recordBlogView,
} from "@/lib/server/blogService";
import { withServerPageError } from "@/components/common/ServerPageErrorFallback";
import "../blog.css";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ slug: string }>;
};

function buildArticleJsonLd(post: {
  title: string;
  excerpt: string;
  coverImage: string;
  authorName: string;
  publishedAt: string | null;
  updatedAt: string;
  slug: string;
  seoDescription: string;
  categoryLabel: string;
  readingMinutes: number;
}) {
  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    articleSection: post.categoryLabel || undefined,
    image: post.coverImage ? [post.coverImage] : undefined,
    author: {
      "@type": "Person",
      name: post.authorName,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    datePublished: post.publishedAt ?? post.updatedAt,
    dateModified: post.updatedAt,
    timeRequired: `PT${post.readingMinutes}M`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublicBlogPostBySlug(slug);
  if (!post) {
    return { title: "Post Not Found" };
  }

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  const url = `${SITE_URL}/blog/${post.slug}`;

  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      authors: [post.authorName],
      section: post.categoryLabel || undefined,
      tags: post.tags,
      images: post.coverImage ? [{ url: post.coverImage, alt: post.title }] : undefined,
    },
    twitter: {
      card: post.coverImage ? "summary_large_image" : "summary",
      title,
      description,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  return withServerPageError(async () => {
    const { slug } = await params;
    const post = await getPublicBlogPostBySlug(slug);
    if (!post) notFound();

    void recordBlogView(post.id);

    const relatedPosts = await getRelatedPublicPosts(post);
    const html = renderBlogContentHtml(post.content);
    const readingMinutes = computeReadingMinutes(post.content);
    const publishedLabel = post.publishedAt
      ? new Date(post.publishedAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null;
    const articleUrl = `${SITE_URL}/blog/${post.slug}`;

    const jsonLd = buildArticleJsonLd({
      title: post.title,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      authorName: post.authorName,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      slug: post.slug,
      seoDescription: post.seoDescription,
      categoryLabel: post.categoryLabel,
      readingMinutes,
    });

    return (
      <main className="storefront-page blog-page blog-page--article">
        <article className="blog-article">
          <div className="blog-article__hero">
            <div className="blog-page__inner blog-article__inner">
              <Link href="/blog" className="blog-article__back">
                ← Back to blog
              </Link>

              <header className="blog-article__header">
                {post.categoryLabel ? (
                  <p className="blog-article__category">{post.categoryLabel}</p>
                ) : null}
                {post.tags.length > 0 ? (
                  <div className="blog-card__tags blog-article__tags">
                    {post.tags.map((tag) => (
                      <span key={tag} className="blog-card__tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
                <h1 className="blog-article__title blog-post__title">{post.title}</h1>
                <div className="blog-article__meta-row">
                  <p className="blog-article__meta">
                    By <strong>{post.authorName}</strong>
                    {publishedLabel ? ` · ${publishedLabel}` : ""}
                  </p>
                  <span className="blog-article__reading">{readingMinutes} min read</span>
                </div>
              </header>

              {post.coverImage ? (
                <figure className="blog-article__cover-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={optimizeImageUrl(post.coverImage, "blogCover")}
                    alt={post.title}
                    className="blog-article__cover"
                  />
                </figure>
              ) : null}

              {post.excerpt ? <p className="blog-article__lead">{post.excerpt}</p> : null}
            </div>
          </div>

          <div className="blog-page__inner blog-article__inner">
            <div className="blog-article__author">
              {post.authorAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.authorAvatar}
                  alt={post.authorName}
                  className="blog-article__author-avatar"
                />
              ) : (
                <div className="blog-article__author-avatar blog-article__author-avatar--placeholder" />
              )}
              <div>
                <p className="blog-article__author-name">{post.authorName}</p>
                {post.authorBio ? (
                  <p className="blog-article__author-bio">{post.authorBio}</p>
                ) : null}
              </div>
            </div>

            <BlogShareBar url={articleUrl} title={post.title} slug={post.slug} />

            <div className="blog-article__prose">
              <div className="blog-article__content" dangerouslySetInnerHTML={{ __html: html }} />
            </div>

            {relatedPosts.length > 0 ? (
              <section className="blog-related" aria-labelledby="blog-related-title">
                <h2 id="blog-related-title" className="blog-related__title">
                  Related articles
                </h2>
                <div className="blog-related__grid">
                  {relatedPosts.map((related) => (
                    <Link
                      key={related.id}
                      href={`/blog/${related.slug}`}
                      className="blog-related__card"
                    >
                      <h3>{related.title}</h3>
                      {related.excerpt ? <p>{related.excerpt}</p> : null}
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            <BlogNewsletterCta />
            <BlogCommentSection slug={post.slug} />

            <footer className="blog-article__footer">
              <p className="blog-article__footer-copy">
                Ready to build your rig? Explore studio gear curated by the Vibe Music team.
              </p>
              <div className="blog-article__footer-actions">
                <Link
                  href="/category/studio-recording"
                  className="blog-article__cta blog-article__cta--primary"
                >
                  Shop studio gear
                </Link>
                <Link href="/blog" className="blog-article__cta">
                  More articles
                </Link>
              </div>
            </footer>
          </div>
        </article>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </main>
    );
  }, "Blog Post");
}
