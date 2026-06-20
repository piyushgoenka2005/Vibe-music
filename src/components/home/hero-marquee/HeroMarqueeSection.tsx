import {
  HERO_MARQUEE_TRACKS,
  trimMarqueeTrack,
} from "@/data/heroMarqueeProducts";
import HeroMarqueeBranchSvg from "@/components/home/hero-marquee/HeroMarqueeBranchSvg";
import MarqueeColumn from "@/components/home/hero-marquee/HeroMarqueeColumns";
import {
  HERO_MARQUEE_COLUMN_CONFIG,
} from "@/components/home/hero-marquee/constants";
import { HeroMarqueeCenterIcon } from "@/components/home/hero-marquee/icons";
import HeroMarqueeRuntime from "@/components/home/hero-marquee/HeroMarqueeRuntime";

export default function HeroMarqueeSection() {
  const columns = HERO_MARQUEE_COLUMN_CONFIG.map((config, index) => ({
    ...config,
    items: trimMarqueeTrack(HERO_MARQUEE_TRACKS[index] ?? HERO_MARQUEE_TRACKS[0]),
  }));

  return (
    <div className="hero_marquee_block hero_marquee_block--paused" data-hero-marquee>
      <HeroMarqueeRuntime />

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

      <div className="hero_marquee_tree">
        <div className="hero_marquee_emblem-wrap">
          <HeroMarqueeCenterIcon />
        </div>
        <HeroMarqueeBranchSvg />
      </div>

      <section aria-labelledby="hero-marquee-title" className="hero_marquee_section">
        <div className="hero_marquee_layout">
          {columns.map((column, index) => (
            <MarqueeColumn
              key={index}
              columnIndex={index}
              direction={column.direction}
              duration={column.duration}
              items={column.items}
              opacity={column.opacity}
            />
          ))}
        </div>
        <div className="hero_marquee_fade hero_marquee_fade--top" aria-hidden />
        <div className="hero_marquee_fade hero_marquee_fade--bottom" aria-hidden />
        <div className="hero_marquee_fade hero_marquee_fade--left" aria-hidden />
        <div className="hero_marquee_fade hero_marquee_fade--right" aria-hidden />
      </section>
    </div>
  );
}
