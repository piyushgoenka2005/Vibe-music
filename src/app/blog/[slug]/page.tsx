import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { renderBlogContentHtml } from "@/lib/blog/render";
import { optimizeImageUrl } from "@/lib/images";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { getPublicBlogPostBySlug } from "@/lib/server/blogService";
import "../blog.css";

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
}) {
  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription || post.excerpt,
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
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
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
  const { slug } = await params;
  const post = await getPublicBlogPostBySlug(slug);
  if (!post) notFound();

  const html = renderBlogContentHtml(post.content);
  const publishedLabel = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const jsonLd = buildArticleJsonLd({
    title: post.title,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    authorName: post.authorName,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    slug: post.slug,
    seoDescription: post.seoDescription,
  });

  return (
    <main className="blog-page blog-page--article" id="main-content">
      <article className="blog-article">
        <div className="blog-page__inner blog-article__inner">
          <Link href="/blog" className="blog-article__back">
            ← Back to blog
          </Link>

          <header className="blog-article__header">
            {post.tags.length > 0 ? (
              <div className="blog-card__tags">
                {post.tags.map((tag) => (
                  <span key={tag} className="blog-card__tag">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            <h1 className="blog-article__title">{post.title}</h1>
            <p className="blog-article__meta">
              By {post.authorName}
              {publishedLabel ? ` · ${publishedLabel}` : ""}
            </p>
          </header>

          {post.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={optimizeImageUrl(post.coverImage, "blogCover")}
              alt=""
              className="blog-article__cover"
            />
          ) : null}

          {post.excerpt ? (
            <p className="blog-article__excerpt">{post.excerpt}</p>
          ) : null}

          <div
            className="blog-article__content"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </article>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
