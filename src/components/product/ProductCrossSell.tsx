import Link from "next/link";
import ProductShareButton from "@/components/product/ProductShareButton";
import StorefrontThumbImage from "@/components/common/StorefrontThumbImage";
import { formatDisplayPrice } from "@/utils/currency";
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
          <div key={product.id} className="pdp-cross-sell__card-wrap">
            <ProductShareButton
              overlay
              position="top-right"
              title={`${product.brand} ${product.name}`}
              url={`/product/${product.slug}`}
            />
            <Link
            href={`/product/${product.slug}`}
            className="pdp-cross-sell__card"
          >
            <div className="pdp-cross-sell__media">
              {product.image ? (
                <StorefrontThumbImage
                  src={product.image}
                  className="pdp-cross-sell__image"
                  width={160}
                  height={160}
                />
              ) : (
                <div
                  className="pdp-cross-sell__swatch"
                  style={{ backgroundColor: product.imageColor }}
                  aria-hidden="true"
                />
              )}
            </div>
            <div className="pdp-cross-sell__brand">{product.brand}</div>
            <div className="pdp-cross-sell__name">{product.name}</div>
            <div className="pdp-cross-sell__price">
              {formatDisplayPrice(product.price)}
            </div>
          </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
