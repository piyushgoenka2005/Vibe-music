import DropshipHeroCenter from "@/components/home/dropship-hero/DropshipHeroCenter";
import DropshipCenterMarquee from "@/components/home/dropship-hero/DropshipCenterMarquee";

export default function DropshipHeroSection() {
  return (
    <section
      className="dropship-hero"
      aria-label="Trending musical instruments and pro audio"
      data-vibe-section="dropship-hero"
    >
      <div className="dropship-spine-line" aria-hidden>
        <span className="dropship-spine-line__segment dropship-spine-line__segment--up" />
        <span className="dropship-spine-line__segment dropship-spine-line__segment--down" />
      </div>

      <DropshipCenterMarquee />
      <DropshipHeroCenter />
    </section>
  );
}
