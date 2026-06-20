import {
  buildGuitarShowcaseRows,
  GUITAR_SHOWCASE_PLACEHOLDER,
  type GuitarShowcaseSpec,
} from "@/lib/product/guitarShowcaseSpecs";
import type { ProductSpec } from "@/types/product";
import "./guitar-spec-showcase.css";

interface GuitarSpecShowcaseProps {
  specs: ProductSpec[];
  imageSrc?: string;
  imageAlt: string;
}

function SpecCell({
  spec,
  align,
}: {
  spec: GuitarShowcaseSpec;
  align: "left" | "right";
}) {
  const isPlaceholder = spec.value === GUITAR_SHOWCASE_PLACEHOLDER;

  return (
    <div
      className={`guitar-spec-showcase__spec guitar-spec-showcase__spec--${align}`}
    >
      <h2 className="guitar-spec-showcase__label">{spec.label}</h2>
      <p
        className={`guitar-spec-showcase__value${isPlaceholder ? " guitar-spec-showcase__value--placeholder" : ""}`}
      >
        {spec.value}
      </p>
    </div>
  );
}

export default function GuitarSpecShowcase({
  specs,
  imageSrc,
  imageAlt,
}: GuitarSpecShowcaseProps) {
  const rows = buildGuitarShowcaseRows(specs);
  const hasImage = Boolean(imageSrc?.trim());

  return (
    <section
      className="guitar-spec-showcase"
      aria-label="Guitar specifications"
    >
      <div className="guitar-spec-showcase__pattern" aria-hidden="true" />
      <div className="guitar-spec-showcase__inner">
        {hasImage ? (
          <div className="guitar-spec-showcase__image-wrap" aria-hidden="true">
            <img
              src={imageSrc}
              alt=""
              className="guitar-spec-showcase__image"
              loading="lazy"
            />
          </div>
        ) : null}

        <div className="guitar-spec-showcase__rows">
          {rows.map((row) => (
            <div
              key={`${row.left.label}-${row.right.label}`}
              className="guitar-spec-showcase__row"
            >
              <SpecCell spec={row.left} align="left" />
              <div
                className="guitar-spec-showcase__divider"
                aria-hidden="true"
              />
              <SpecCell spec={row.right} align="right" />
            </div>
          ))}
        </div>

        {hasImage ? (
          <div className="guitar-spec-showcase__mobile-image">
            <img src={imageSrc} alt={imageAlt} loading="lazy" />
          </div>
        ) : null}
      </div>
    </section>
  );
}
