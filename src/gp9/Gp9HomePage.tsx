import { HeroSection } from "@/gp9/components/sections/hero-section";
import { PhilosophySection } from "@/gp9/components/sections/philosophy-section";
import { FeaturedProductsSection } from "@/gp9/components/sections/featured-products-section";
import { TechnologySection } from "@/gp9/components/sections/technology-section";
import { SpeakersSection } from "@/gp9/components/sections/speakers-section";
import { MidlifeEngineeringSection } from "@/gp9/components/sections/midlife-engineering-section";
import { GallerySection } from "@/gp9/components/sections/gallery-section";
import { CollectionSection } from "@/gp9/components/sections/collection-section";
import { SpinnerSection } from "@/gp9/components/sections/spinner-section";
import { InteractivePianoSection } from "@/gp9/components/sections/interactive-piano-section";
import { EditorialSection } from "@/gp9/components/sections/editorial-section";
import { MovingKeysSection } from "@/gp9/components/sections/moving-keys-section";
import { LineupSection } from "@/gp9/components/sections/lineup-section";
import { SpecsSection } from "@/gp9/components/sections/specs-section";
import { TestimonialsSection } from "@/gp9/components/sections/testimonials-section";
import { CtaSection } from "@/gp9/components/sections/cta-section";
import { Marquee } from "@/gp9/components/ui/marquee";

const heroMarquee = [
  "Roland GP-9",
  "Digital Grand Piano",
  "Piano Reality Sound",
  "Modern Elegance",
  "Concert Hall at Home",
];

const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Roland GP-9 Digital Grand Piano",
  brand: { "@type": "Brand", name: "Roland" },
  description:
    "A premium digital grand piano with Piano Reality Modeling, hybrid keyboard, and Piano Reality Projection sound system.",
  image: "https://static.roland.com/products/gp-9/images/gp-9_hero.jpg",
  category: "Digital Piano",
};

export default function Gp9HomePage() {
  return (
    <main className="premium-home gp9-page relative min-h-screen w-full max-w-full overflow-x-clip">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <h1 className="visually-hidden">Roland GP-9 Digital Grand Piano | Vibe Music</h1>
      <HeroSection />
      <Marquee items={heroMarquee} speed="slow" />
      <PhilosophySection />
      <FeaturedProductsSection />
      <TechnologySection />
      <SpeakersSection />
      <MidlifeEngineeringSection />
      <GallerySection />
      <CollectionSection />
      <SpinnerSection />
      <InteractivePianoSection />
      <EditorialSection />
      <MovingKeysSection />
      <LineupSection />
      <SpecsSection />
      <TestimonialsSection />
      <CtaSection />
    </main>
  );
}
