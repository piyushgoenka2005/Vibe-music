import DropshipHeroSection from "@/components/home/dropship-hero/DropshipHeroSection";

export default function HeroMarqueeSection() {
  return (
    <div className="hero_marquee_block hero_marquee_block--dropship" data-hero-marquee>
      <header className="hero_marquee_header">
        <p className="hero_marquee_eyebrow">
          <span className="hero_marquee_eyebrow-line" aria-hidden />
          Shop by category
          <span className="hero_marquee_eyebrow-line" aria-hidden />
        </p>
        <h2 id="hero-marquee-title" className="hero_marquee_title">
          Find Your Product
        </h2>
        <p className="hero_marquee_subtitle">
          Curated departments for every stage — from bedroom studio to main stage.
        </p>
      </header>

      <DropshipHeroSection />
    </div>
  );
}
