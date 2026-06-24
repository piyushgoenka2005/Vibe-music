"use client";

import Link from "next/link";
import { forwardRef, type MouseEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { optimizeImageUrl } from "@/lib/images";
import { categoryPath, productPath, ROUTES } from "@/lib/routes";
import { fetchProducts } from "@/services/products.api";
import { formatCurrency } from "@/utils/currency";
import { useCartStore } from "@/store/cartStore";
import RollingText from "@/components/common/RollingText";
import type { Product } from "@/types/product";

const PANEL_CATEGORIES = [
  { label: "01 / Pro audio", href: categoryPath("studio-recording") },
  { label: "02 / Instruments", href: categoryPath("guitars") },
  { label: "03 / Studio gear", href: categoryPath("studio-recording") },
  { label: "04 / Expert setup", href: `${ROUTES.search}?q=studio+setup` },
] as const;

function FooterProductSnippet({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const image = product.image;
  const href = productPath(product.slug);
  const outOfStock = product.availability === "out-of-stock";

  function handleQuickAdd(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (outOfStock) return;
    addItem(product);
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
  const { data: products = [] } = useQuery({
    queryKey: ["footer-trending-products"],
    queryFn: () => fetchProducts({ trending: true, limit: 4 }),
    staleTime: 60_000,
  });

  return (
    <div ref={ref} className="footer-products-panel" data-footer-panel>
      <div className="footer-products-panel__inner">
        <div className="footer-products-panel__header">
          <p className="footer-products-panel__title">Trending at Vibe Music</p>
          <div className="footer-products-panel__details">
            <Link href={ROUTES.search} className="footer-products-panel__meta-link">
              <RollingText>All categories</RollingText>
            </Link>
            <div className="footer-products-panel__meta">
              {PANEL_CATEGORIES.map((category) => (
                <Link
                  key={category.label}
                  href={category.href}
                  className="footer-products-panel__category-link"
                >
                  <RollingText>{category.label}</RollingText>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="footer-products-panel__products">
          {products.map((product) => (
            <FooterProductSnippet key={product.id} product={product} />
          ))}
        </div>

        <Link href={ROUTES.search} className="footer-products-panel__shop-all">
          <RollingText>Shop all gear</RollingText>
          <ArrowUpRight size={14} strokeWidth={2.5} aria-hidden />
        </Link>
      </div>
    </div>
  );
});

export default FooterProductsPanel;
