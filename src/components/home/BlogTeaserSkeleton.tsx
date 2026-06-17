export default function BlogTeaserSkeleton() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading articles"
      className="blog-teaser blog-teaser--loading"
    >
      <div className="blog-teaser__inner">
        <div className="blog-teaser__header">
          <div className="blog-teaser__header-copy">
            <div className="section-skeleton__line section-skeleton__line--eyebrow" />
            <div className="section-skeleton__line section-skeleton__line--title" />
            <div className="section-skeleton__line section-skeleton__line--subtitle" />
          </div>
          <div className="section-skeleton__line section-skeleton__line--button" />
        </div>

        <div className="blog-teaser__grid blog-teaser__grid--three">
          {Array.from({ length: 3 }).map((_, index) => (
            <div className="blog-teaser-skeleton__card" key={index}>
              <div className="blog-teaser-skeleton__image" />
              <div className="blog-teaser-skeleton__body">
                <div className="section-skeleton__line section-skeleton__line--post-title" />
                <div className="section-skeleton__line section-skeleton__line--excerpt" />
                <div className="section-skeleton__line section-skeleton__line--excerpt section-skeleton__line--short" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
