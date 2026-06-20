"use client";

import Link from "next/link";
import { forwardRef, type MouseEvent } from "react";
import { ArrowUpRight } from "lucide-react";
import trendingProducts from "@/data/catalog/trending-products.json";
import { optimizeImageUrl } from "@/lib/images";
import { categoryPath, productPath, ROUTES } from "@/lib/routes";
import { formatCurrency } from "@/utils/currency";
import { useCartStore } from "@/store/cartStore";
import type { Product, ProductAvailability, ProductCondition } from "@/types/product";

const PANEL_PRODUCTS = trendingProducts.slice(0, 4);

const PANEL_CATEGORIES = [
  { label: "01 / Pro audio", href: categoryPath("studio-recording") },
  { label: "02 / Instruments", href: categoryPath("guitars") },
  { label: "03 / Studio gear", href: categoryPath("studio-recording") },
  { label: "04 / Expert setup", href: `${ROUTES.search}?q=studio+setup` },
] as const;

type TrendingCatalogProduct = (typeof trendingProducts)[number];

function toCartProduct(product: TrendingCatalogProduct): Product {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    brandSlug: product.brandSlug,
    category: product.category,
    categorySlug: product.categorySlug,
    price: product.price,
    rating: product.rating,
    reviewCount: product.reviewCount,
    availability: product.availability as ProductAvailability,
    condition: product.condition as ProductCondition,
    imageColor: product.imageColor,
    image: product.image,
  };
}

function FooterProductSnippet({ product }: { product: TrendingCatalogProduct }) {
  const addItem = useCartStore((state) => state.addItem);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const image = product.images?.[0] ?? product.image;
  const href = productPath(product.slug);
  const outOfStock = product.availability === "out-of-stock";

  function handleQuickAdd(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (outOfStock) return;
    addItem(toCartProduct(product));
    openDrawer();
  }

  return (
    <article className="footer-product-snippet">
      <Link href={href} className="footer-product-snippet__link">
        <div className="footer-product-snippet__thumb">
          {image ? (
            <img
              src={optimizeImageUrl(image, "productCard")}
              alt=""
              loading="lazy"
              decoding="async"
            />
          ) : null}
        </div>
        <div className="footer-product-snippet__body">
          <div className="footer-product-snippet__copy">
            <p className="footer-product-snippet__title">{product.name}</p>
            <p className="footer-product-snippet__subtitle">{product.brand}</p>
          </div>
          <p className="footer-product-snippet__price">{formatCurrency(product.price)}</p>
        </div>
      </Link>
      <button
        type="button"
        className="footer-product-snippet__add"
        onClick={handleQuickAdd}
        disabled={outOfStock}
        aria-label={`Add ${product.name} to cart`}
      >
        +
      </button>
    </article>
  );
}

const FooterProductsPanel = forwardRef<HTMLDivElement>(function FooterProductsPanel(_, ref) {
  return (
    <div ref={ref} className="footer-products-panel" data-footer-panel>
      <div className="footer-products-panel__inner">
        <div className="footer-products-panel__header">
          <p className="footer-products-panel__title">Trending at Vibe Music</p>
          <div className="footer-products-panel__details">
            <Link href={ROUTES.search} className="footer-products-panel__meta-link">
              All categories
            </Link>
            <div className="footer-products-panel__meta">
              {PANEL_CATEGORIES.map((category) => (
                <Link
                  key={category.label}
                  href={category.href}
                  className="footer-products-panel__category-link"
                >
                  {category.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="footer-products-panel__products">
          {PANEL_PRODUCTS.map((product) => (
            <FooterProductSnippet key={product.id} product={product} />
          ))}
        </div>

        <Link href={ROUTES.search} className="footer-products-panel__shop-all">
          Shop all gear
          <ArrowUpRight size={14} strokeWidth={2.5} aria-hidden />
        </Link>

        <p className="footer-products-panel__disclaimer">
          Prices and availability shown for demo catalog items. Final pricing confirmed at checkout.
        </p>
      </div>
    </div>
  );
});

export default FooterProductsPanel;
