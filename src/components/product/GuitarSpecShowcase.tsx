import {
  buildGuitarShowcaseRows,
  GUITAR_SHOWCASE_IMAGE,
  GUITAR_SHOWCASE_IMAGE_ALT,
  GUITAR_SHOWCASE_PLACEHOLDER,
  type GuitarShowcaseSpec,
} from "@/lib/product/guitarShowcaseSpecs";
import { optimizeImageUrl } from "@/lib/images";
import type { ProductSpec } from "@/types/product";
import ProductImage from "@/components/common/ProductImage";
import "./guitar-spec-showcase.css";

interface GuitarSpecShowcaseProps {
  specs: ProductSpec[];
  productName: string;
  brand: string;
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
  productName,
  brand,
}: GuitarSpecShowcaseProps) {
  const rows = buildGuitarShowcaseRows(specs, { productName, brand });
  const showcaseImage = optimizeImageUrl(GUITAR_SHOWCASE_IMAGE, "productDetail");

  return (
    <section
      className="guitar-spec-showcase"
      aria-label="Guitar specifications"
    >
      <div className="guitar-spec-showcase__pattern" aria-hidden="true" />
      <div className="guitar-spec-showcase__inner">
        <div className="guitar-spec-showcase__image-wrap" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative guitar showcase */}
          <ProductImage
            src={showcaseImage}
            alt=""
            className="guitar-spec-showcase__image"
            loading="lazy"
          />
        </div>

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

        <div className="guitar-spec-showcase__mobile-image">
          {/* eslint-disable-next-line @next/next/no-img-element -- mobile guitar showcase */}
          <ProductImage src={showcaseImage} alt={GUITAR_SHOWCASE_IMAGE_ALT} loading="lazy" />
        </div>
      </div>
    </section>
  );
}
