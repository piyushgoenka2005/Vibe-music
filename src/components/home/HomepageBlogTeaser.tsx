import Link from "next/link";
import {
  HOMEPAGE_TRENDING_CTA,
  HOMEPAGE_TRENDING_FALLBACK_PRODUCTS,
} from "@/data/homepageTrendingProducts";
import type { HomepageTopProduct } from "@/data/homepageTopProducts";
import { productPath } from "@/lib/routes";
import { getTrendingProducts } from "@/lib/server/productRepository";
import SECTION_CTA_ARROW from "@/components/homepage/SectionCtaArrow";
import Reveal from "@/components/layout/Reveal";
import { TopProductCard } from "@/components/home/HomepageTopProducts";
import type { Product } from "@/types/product";

const HEADLINE_ID = "trending-buys-title";
const DISPLAY_LIMIT = 3;
/** Prefer live trending, but never block the homepage on a cold catalog. */
const TRENDING_BUDGET_MS = 450;

function catalogProductToTeaser(product: Product): HomepageTopProduct {
  return {
    id: product.id,
    title: product.name,
    excerpt: `${product.brand} · ${product.category}`,
    tags: [product.category, "Trending"],
    href: productPath(product.slug),
    image: product.image,
    brandLabel: product.brand,
    productSlug: product.slug,
    imageFit: "contain",
  };
}

async function resolveTrendingProducts(): Promise<HomepageTopProduct[]> {
  try {
    const trending = await Promise.race([
      getTrendingProducts().then((list) =>
        list.filter((product) => product.price > 0)
      ),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), TRENDING_BUDGET_MS);
      }),
    ]);

    if (trending && trending.length > 0) {
      return trending.slice(0, DISPLAY_LIMIT).map(catalogProductToTeaser);
    }
  } catch {
    // Fall through to curated cards.
  }

  return HOMEPAGE_TRENDING_FALLBACK_PRODUCTS.slice(0, DISPLAY_LIMIT);
}

export default async function HomepageBlogTeaser() {
  const products = await resolveTrendingProducts();

  const gridModifier =
    products.length === 1 ? "one" : products.length === 2 ? "two" : "three";

  return (
    <Reveal as="section" className="blog-teaser" aria-labelledby={HEADLINE_ID}>
      <div className="blog-teaser__inner">
        <header className="blog-teaser__header">
          <div className="blog-teaser__header-copy">
            <p className="blog-teaser__eyebrow">Trending now</p>
            <h2 className="blog-teaser__title" id={HEADLINE_ID}>
              Buy what&apos;s trending
            </h2>
            <p className="blog-teaser__subtitle">
              In-stock gear other musicians are shopping right now — products
              only, ready to add to cart.
            </p>
          </div>
          <Link
            className="homepage-section__cta-btn blog-teaser__all"
            href={HOMEPAGE_TRENDING_CTA}
          >
            Shop all trending
            {SECTION_CTA_ARROW}
          </Link>
        </header>

        {products.length === 0 ? (
          <p className="blog-teaser__subtitle">
            Trending products will appear here once the catalog is available.{" "}
            <Link href={HOMEPAGE_TRENDING_CTA}>Browse the shop</Link>.
          </p>
        ) : (
          <div className={`blog-teaser__grid blog-teaser__grid--${gridModifier}`}>
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
