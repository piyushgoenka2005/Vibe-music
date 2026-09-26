import "@/components/homepage/homepage-dynamic.css";

export default function GearStoriesSectionSkeleton() {
  return (
    <section
      className="gear-stories gear-stories--loading"
      aria-busy="true"
      aria-label="Loading gear stories"
    >
      <header className="gear-stories__header">
        <div className="section-skeleton__line gear-stories__header-skeleton-title" />
        <div className="section-skeleton__line gear-stories__header-skeleton-subtitle" />
      </header>
      <div className="gear-stories__strip-outer">
        <div className="gear-stories__marquee">
          <div className="gear-stories__marquee-track">
            <div className="gear-stories__sequence">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="gear-stories__item">
                  <div className="gear-stories-skeleton__card" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
