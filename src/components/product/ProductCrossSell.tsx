import Link from "next/link";
import type { Product } from "@/types/product";

interface ProductCrossSellProps {
  title: string;
  products: Product[];
}

export default function ProductCrossSell({
  title,
  products,
}: ProductCrossSellProps) {
  if (products.length === 0) return null;

  return (
    <section className="pdp-section" aria-label={title}>
      <h2 className="pdp-section__title">{title}</h2>
      <div className="pdp-cross-sell">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.slug}`}
            className="pdp-cross-sell__card"
          >
            <div
              className="pdp-cross-sell__swatch"
              style={{ backgroundColor: product.imageColor }}
              aria-hidden="true"
            />
            <div className="pdp-cross-sell__brand">{product.brand}</div>
            <div className="pdp-cross-sell__name">{product.name}</div>
            <div className="pdp-cross-sell__price">
              ${product.price.toFixed(2)}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
