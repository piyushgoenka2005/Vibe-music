import Link from "next/link";
import {
  heroMarqueeProductHref,
  type HeroMarqueeProduct,
} from "@/data/heroMarqueeProducts";
import GrowthArrowIcon from "@/components/home/dropship-hero/GrowthArrowIcon";

interface DropshipProductCardProps {
  product: HeroMarqueeProduct;
}

export default function DropshipProductCard({ product }: DropshipProductCardProps) {
  const href = heroMarqueeProductHref(product);

  return (
    <div className="dropship-marquee-card-wrap">
      <Link
        className="dropship-product-card"
        href={href}
        prefetch
        aria-label={`View ${product.name}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="dropship-card-img"
          src={product.image}
          alt={product.imageAlt}
          loading="lazy"
          decoding="async"
          width={44}
          height={44}
        />
        <div className="dropship-card-left">
          <div className="dropship-card-name">{product.name}</div>
          <div className="dropship-card-price">Price {product.price}</div>
        </div>
        <div className="dropship-card-divider" aria-hidden />
        <div className="dropship-card-right">
          <div className="dropship-card-revenue-row">
            <span className="dropship-card-revenue">{product.revenue}</span>
            <span className="dropship-card-growth">
              <GrowthArrowIcon />
              {product.growth}
            </span>
          </div>
          <div className="dropship-card-rev-label">Revenue</div>
        </div>
      </Link>
    </div>
  );
}
