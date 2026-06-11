export default function HeroBanner() {
  return (
    <div className="sw-hero sw-hero--dark sw-hero--center relative w-full overflow-hidden bg-[var(--hero-dark)] text-white">
      <div className="sw-hero__main relative block min-h-[400px] w-full max-h-[800px] overflow-hidden md:min-h-[500px] md:h-[40vh]">
        <img
          src="/images/m/home/0817-gx-new-homepagetile.jpg?format=webp"
          alt="Featured promotion"
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />

        <div className="sw-hero__overlay absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

        <div className="sw-hero__content absolute inset-0 z-[2] flex items-center">
          <div className="sw-container w-full">
            <div className="sw-hero__copy max-w-2xl text-left">
              <span className="sw-hero__eyebrow mb-2 inline-block text-sm font-semibold uppercase tracking-[0.1em]">
                Limited Time
              </span>

              <h1 className="sw-hero__headline mb-3 mt-0 text-[clamp(2rem,6vw,4rem)] font-bold leading-none">
                Gear Up For Your Next Performance
              </h1>

              <p className="sw-hero__subhead mb-6 max-w-[35ch] text-[clamp(1rem,2vw,1.25rem)] font-normal leading-snug text-white/90">
                Explore guitars, keyboards, studio equipment, and professional audio solutions.
              </p>

              <a href="#" className="sw-hero__cta sw-hero__cta--solid inline-block rounded-full border-2 border-transparent bg-white px-7 py-2.5 text-[clamp(0.9rem,1.5vw,1.125rem)] font-semibold text-[var(--hero-dark)] transition hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                Shop Now
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="sw-hero__stripe bg-[var(--hero-dark)] px-10 py-6 text-center text-base font-light tracking-[0.025rem] text-white">
        <strong className="uppercase tracking-[0.125rem]">0% Financing Available</strong>
        <span className="mx-4">|</span>
        On qualifying purchases.
        <a href="#" className="ml-6 font-medium underline hover:opacity-80">
          Learn More
        </a>
      </div>
    </div>
  );
}
