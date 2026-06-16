import Link from "next/link";
import { listPublicBlogPosts } from "@/lib/server/blogService";
import { optimizeImageUrl } from "@/lib/images";
import { ROUTES } from "@/lib/routes";
import Reveal from "@/components/layout/Reveal";

export default async function HomepageBlogTeaser() {
  const posts = (await listPublicBlogPosts()).slice(0, 3);

  if (posts.length === 0) return null;

  return (
    <Reveal as="section" className="blog-teaser">
      <div className="blog-teaser__header">
        <div>
          <p className="blog-teaser__eyebrow">Guides & stories</p>
          <h2 className="blog-teaser__title">Learn before you buy</h2>
        </div>
        <Link href={ROUTES.blog} className="premium-btn premium-btn--outline blog-teaser__all">
          View all articles
        </Link>
      </div>

      <div className="blog-teaser__grid">
        {posts.map((post, index) => (
          <Reveal key={post.id} className="blog-teaser__card" delay={index * 80}>
            <Link href={`${ROUTES.blog}/${post.slug}`} className="blog-teaser__link">
              {post.coverImage ? (
                <img
                  src={optimizeImageUrl(post.coverImage, "blogCover")}
                  alt=""
                  className="blog-teaser__image"
                  loading="lazy"
                />
              ) : (
                <div className="blog-teaser__image blog-teaser__image--placeholder" />
              )}
              <div className="blog-teaser__body">
                <h3 className="blog-teaser__post-title">{post.title}</h3>
                {post.excerpt ? (
                  <p className="blog-teaser__excerpt">{post.excerpt}</p>
                ) : null}
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </Reveal>
  );
}
