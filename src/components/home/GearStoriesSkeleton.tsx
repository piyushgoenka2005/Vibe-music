export default function GearStoriesSkeleton() {
  return (
    <section
      className="gear-stories gear-stories--loading"
      aria-busy="true"
      aria-label="Loading gear stories"
    >
      <header className="gear-stories__header">
        <div className="section-skeleton__line section-skeleton__line--title gear-stories__header-skeleton-title" />
        <div className="section-skeleton__line section-skeleton__line--subtitle gear-stories__header-skeleton-subtitle" />
      </header>

      <div className="gear-stories__strip-outer">
        <div className="gear-stories__strip">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="gear-stories__item">
              <div className="gear-stories-skeleton__card" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
