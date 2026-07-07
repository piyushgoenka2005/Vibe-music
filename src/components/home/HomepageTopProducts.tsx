import Link from "next/link";
import ProductShareButton from "@/components/product/ProductShareButton";
import {
  HOMEPAGE_TOP_PRODUCTS,
  HOMEPAGE_TOP_PRODUCTS_CTA,
  type HomepageTopProduct,
} from "@/data/homepageTopProducts";
import { getProductBySlug } from "@/lib/server/productRepository";
import { optimizeImageUrl } from "@/lib/images";
import SECTION_CTA_ARROW from "@/components/homepage/SectionCtaArrow";
import Reveal from "@/components/layout/Reveal";

const HEADLINE_ID = "top-products-title";

function TopProductCard({ product }: { product: HomepageTopProduct }) {
  const imagePreset = product.imageFit === "contain" ? "productDetail" : "blogCover";
  const imageSrc = optimizeImageUrl(product.image, imagePreset);
  const imageFit = product.imageFit ?? "cover";

  return (
    <article className="blog-teaser__card">
      <ProductShareButton
        overlay
        position="top-right"
        title={product.title}
        url={product.href}
      />
      <Link className="blog-teaser__link" href={product.href}>
        <div
          className={[
            "blog-teaser__media",
            imageFit === "contain" ? "blog-teaser__media--contain" : "",
            product.imageMediaClass ?? "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {product.image ? (
            <img
              alt=""
              className={[
                "blog-teaser__image",
                imageFit === "contain" ? "blog-teaser__image--contain" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              loading="lazy"
              src={imageSrc}
              style={
                product.imageObjectPosition
                  ? { objectPosition: product.imageObjectPosition }
                  : undefined
              }
            />
          ) : (
            <div className="blog-teaser__image blog-teaser__image--placeholder" />
          )}
          {product.tags.length > 0 ? (
            <div aria-label="Product categories" className="blog-teaser__tags">
              <span className="blog-teaser__tag blog-teaser__tag--primary">
                {product.tags[0]}
              </span>
              {product.tags[1] ? (
                <>
                  <span aria-hidden="true" className="blog-teaser__tag-sep" />
                  <span className="blog-teaser__tag blog-teaser__tag--secondary">
                    {product.tags[1]}
                  </span>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="blog-teaser__body">
          <h3 className="blog-teaser__post-title">{product.title}</h3>
          {product.excerpt ? (
            <p className="blog-teaser__excerpt">{product.excerpt}</p>
          ) : null}
          <div className="blog-teaser__footer">
            <p className="blog-teaser__meta">{product.brandLabel}</p>
            <span className="blog-teaser__read">
              View product
              {SECTION_CTA_ARROW}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

async function resolveTopProducts(): Promise<HomepageTopProduct[]> {
  const resolved = await Promise.all(
    HOMEPAGE_TOP_PRODUCTS.map(async (product) => {
      if (!product.productSlug || product.pinImage) return product;

      try {
        const catalogProduct = await getProductBySlug(product.productSlug);
        if (!catalogProduct) return product;

        const catalogImage = catalogProduct.image || product.image;

        return {
          ...product,
          image: catalogImage,
          href: product.href,
        };
      } catch {
        return product;
      }
    })
  );

  return resolved;
}

export default async function HomepageTopProducts() {
  const products = await resolveTopProducts();

  return (
    <Reveal as="section" className="blog-teaser" aria-labelledby={HEADLINE_ID}>
      <div className="blog-teaser__inner">
        <header className="blog-teaser__header">
          <div className="blog-teaser__header-copy">
            <p className="blog-teaser__eyebrow">Top products at Vibe Music</p>
            <h2 className="blog-teaser__title" id={HEADLINE_ID}>
              Shop the highlights
            </h2>
            <p className="blog-teaser__subtitle">
              Grand pianos, guitars, and live sound — hand-picked gear from our
              showroom floor.
            </p>
          </div>
          <Link
            className="homepage-section__cta-btn blog-teaser__all"
            href={HOMEPAGE_TOP_PRODUCTS_CTA}
          >
            View all products
            {SECTION_CTA_ARROW}
          </Link>
        </header>

        <div className="blog-teaser__grid blog-teaser__grid--three">
          {products.map((product, index) => (
            <Reveal
              key={product.id}
              className="blog-teaser__card-wrap"
              delay={index * 80}
            >
              <TopProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
