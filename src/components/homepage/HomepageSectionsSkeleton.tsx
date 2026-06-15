export default function HomepageSectionsSkeleton() {
  return (
    <div className="homepage-wrapper homepage-wrapper--loading" id="main-content" aria-busy="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <section key={index} className="homepage-section-skeleton">
          <div className="homepage-section-skeleton__title" />
          <div className="homepage-section-skeleton__grid">
            {Array.from({ length: 4 }).map((__, cardIndex) => (
              <div key={cardIndex} className="homepage-section-skeleton__card" />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
