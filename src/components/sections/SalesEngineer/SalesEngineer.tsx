export default function SalesEngineer() {
  return (
    <section className="sw-section border-b border-[var(--grey10)] bg-white">
      <div className="sw-container">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div className="overflow-hidden rounded border border-[var(--grey10)]">
            <img
              src="https://media.vibemusic.in/m/include/footer/images/new-gear-day/15.jpg?format=webp"
              alt="Sales engineer helping a customer"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--blue)]">
              Expert Guidance
            </p>
            <h2 className="mb-4 text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-tight text-[var(--grey100)]">
              Your Personal Sales Engineer
            </h2>
            <p className="mb-6 text-base leading-relaxed text-[var(--grey60)]">
              Get one-on-one support from experienced musicians and audio
              professionals. Whether you&apos;re building a home studio, choosing
              your first guitar, or upgrading a live sound setup, our experts are
              here to help.
            </p>
            <a href="#" className="sw-btn sw-btn-blue">
              Contact An Expert
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
