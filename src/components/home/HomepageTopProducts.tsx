import Link from "next/link";
import Image from "next/image";
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

import { generateCdnSrcSet } from "@/components/common/ProductImage";

const HEADLINE_ID = "top-products-title";

export function TopProductCard({ product }: { product: HomepageTopProduct }) {
  const imagePreset = product.imageFit === "contain" ? "productDetail" : "blogCover";
  // Always use sized thumbs/derivatives — full CDN PNG masters can be multi‑MB.
  const imageSrc = optimizeImageUrl(product.image, imagePreset);
  const imageFit = product.imageFit ?? "cover";
  const usePlainImg =
    imageSrc.startsWith("/api/media/thumb") ||
    imageSrc.startsWith("https://cdn.vibemusic.in/");
  const imageClassName = [
    "blog-teaser__image",
    imageFit === "contain" ? "blog-teaser__image--contain" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const srcSet = usePlainImg ? generateCdnSrcSet(imageSrc) : undefined;

  return (
    <article className="blog-teaser__card">
      <ProductShareButton
        overlay
        position="top-left"
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
            <Image
              alt=""
              className={imageClassName}
              fill
              loading="lazy"
              sizes="(max-width: 767px) 92vw, 360px"
              src={imageSrc}
              style={{
                objectFit: imageFit,
                ...(product.imageObjectPosition
                  ? { objectPosition: product.imageObjectPosition }
                  : null),
              }}
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
  // Curated pinImage cards (and non-catalog surfaces like GP-9) render
  // immediately — skip per-slug catalog round-trips that blocked Suspense.
  const needsCatalogLookup = HOMEPAGE_TOP_PRODUCTS.some(
    (product) => Boolean(product.productSlug) && !product.pinImage
  );

  if (!needsCatalogLookup) {
    return HOMEPAGE_TOP_PRODUCTS;
  }

  const resolved = await Promise.all(
    HOMEPAGE_TOP_PRODUCTS.map(async (product) => {
      if (!product.productSlug || product.pinImage) return product;

      try {
        const catalogProduct = await getProductBySlug(product.productSlug);
        if (!catalogProduct) return null;

        return {
          ...product,
          image: catalogProduct.image || product.image,
          href: product.href,
        };
      } catch {
        return null;
      }
    })
  );

  return resolved.filter((product): product is HomepageTopProduct => Boolean(product));
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
              Grand pianos, guitars, and live sound — hand-picked in-stock gear
              from our catalog.
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

        {products.length === 0 ? (
          <p className="blog-teaser__subtitle">
            Featured products will appear here once the catalog is available.{" "}
            <Link href={HOMEPAGE_TOP_PRODUCTS_CTA}>Browse the shop</Link>.
          </p>
        ) : (
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
        )}
      </div>
    </Reveal>
  );
}
