import type { SalesEngineerSlide } from "@/data/salesEngineer";

interface SalesEngineerCardProps {
  slide: SalesEngineerSlide;
  isCurrent: boolean;
}

/** One rotating hero slide in the generic Sales Engineer carousel. */
export default function SalesEngineerCard({
  slide,
  isCurrent,
}: SalesEngineerCardProps) {
  return (
    <div
      className="se-g--slide"
      id={isCurrent ? "se-g--slide--current" : undefined}
    >
      <picture>
        <img src={slide.imageSrc} alt={slide.imageAlt} loading="lazy" />
      </picture>
      <div className="se-g--name">
        {slide.name} <span>{slide.title}</span>
      </div>
    </div>
  );
}
