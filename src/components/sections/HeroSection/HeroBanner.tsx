import Link from "next/link";

export default function HeroBanner() {
  return (
    <section className="hero">
      <Link
        href="/search/results?q=epiphone+futura"
        className="sw-hero__main"
        style={{ backgroundColor: "#161616" }}
      >
        <div className="sw-hero__content">
          <div className="sw-hero__copy">
            <div className="sw-hero__eyebrow">
              <img
                src="https://media.sweetwater.com/m/images/manufacturer-logos/homepage-brands/epiphone_reverse.svg"
                alt="Epiphone"
              />
            </div>
            <div className="sw-hero__headline">
              NEW Futura
              <br />
              Guitars
            </div>
            <p className="sw-hero__subhead">
              Timeless designs and pro-level upgrades.
            </p>
            <span className="sw-hero__cta">Shop Now</span>
          </div>
        </div>
        <div className="sw-hero__image-side">
          <img
            src="https://media.sweetwater.com/m/home/takeovers/2026/gibson-spotlight/Epiphone-Superhero-x2.jpg?format=webp&optimize=medium"
            alt="NEW Epiphone Futura Guitars"
          />
        </div>
      </Link>

      <div className="hero-banner-footer">
        <span>GIBSON BRANDS 48-MONTH SPECIAL FINANCING*</span>
        <div>
          <Link href="/search?q=financing">Learn More</Link>
          <Link href="/search/results?q=gibson+offers">Shop the Offers</Link>
        </div>
      </div>
    </section>
  );
}
