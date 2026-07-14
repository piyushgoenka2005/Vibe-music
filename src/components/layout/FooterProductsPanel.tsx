"use client";

import Link from "next/link";
import { forwardRef, useEffect, useRef, type MouseEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { categoryPath, productPath, ROUTES } from "@/lib/routes";
import { formatDisplayPrice, isPurchasablePrice } from "@/utils/currency";
import { useCartStore } from "@/store/cartStore";
import { useToastStore } from "@/store/toastStore";
import RollingText from "@/components/common/RollingText";
import StorefrontThumbImage from "@/components/common/StorefrontThumbImage";
import NotifyMeButton from "@/components/product/NotifyMeButton";
import type { Product } from "@/types/product";

const FOOTER_TRENDING_LIMIT = 4;
const FOOTER_TRENDING_STALE_MS = 60_000;
const FOOTER_TRENDING_REFETCH_MS = 5 * 60_000;

async function fetchFooterTrendingProducts(): Promise<Product[]> {
  const response = await fetch(
    `/api/products/footer-trending?limit=${FOOTER_TRENDING_LIMIT}`
  );
  if (!response.ok) {
    throw new Error("Unable to load trending products");
  }
  const data = (await response.json()) as { products?: Product[] };
  return data.products ?? [];
}

const PANEL_CATEGORIES = [
  { label: "01 / Pro audio", href: categoryPath("studio-recording") },
  { label: "02 / Instruments", href: categoryPath("guitars") },
  { label: "03 / Studio gear", href: categoryPath("studio-recording") },
  { label: "04 / Expert setup", href: `${ROUTES.search}?q=studio+setup` },
] as const;

function FooterProductSnippet({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const showToast = useToastStore((state) => state.show);
  const image = product.image;
  const href = productPath(product.slug);
  const outOfStock = product.availability === "out-of-stock";
  const comingSoon = !isPurchasablePrice(product.price);

  function handleQuickAdd(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (comingSoon) {
      showToast("This product is Coming Soon and can’t be added yet.", "info");
      return;
    }
    if (outOfStock) {
      showToast("This product is currently out of stock.", "info");
      return;
    }
    addItem(product);
    openDrawer();
  }

  return (
    <article className="footer-product-snippet">
      <Link href={href} className="footer-product-snippet__link">
        <div className="footer-product-snippet__thumb">
          {image ? (
            <StorefrontThumbImage
              src={image}
              alt={product.name}
              width={128}
              height={128}
              preferOriginal
            />
          ) : null}
        </div>
        <div className="footer-product-snippet__body">
          <div className="footer-product-snippet__copy">
            <p className="footer-product-snippet__title">{product.name}</p>
            <p className="footer-product-snippet__subtitle">{product.brand}</p>
          </div>
          <p className="footer-product-snippet__price">{formatDisplayPrice(product.price)}</p>
        </div>
      </Link>
      {comingSoon ? (
        <NotifyMeButton
          variant="inline"
          className="footer-product-snippet__add"
          productId={product.id}
          productSlug={product.slug}
          productName={product.name}
        />
      ) : (
        <button
          type="button"
          className="footer-product-snippet__add"
          onClick={handleQuickAdd}
          onPointerDown={(event) => event.stopPropagation()}
          disabled={outOfStock}
          aria-label={
            outOfStock
              ? `${product.name} is out of stock`
              : `Add ${product.name} to cart`
          }
        >
          +
        </button>
      )}
    </article>
  );
}

const FooterProductsPanel = forwardRef<HTMLDivElement>(function FooterProductsPanel(_, ref) {
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ["footer-trending-products"],
    queryFn: fetchFooterTrendingProducts,
    staleTime: FOOTER_TRENDING_STALE_MS,
    refetchInterval: FOOTER_TRENDING_REFETCH_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    const node = panelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          void refetch();
        }
      },
      { rootMargin: "120px 0px", threshold: 0.12 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [refetch]);

  function setPanelRef(node: HTMLDivElement | null) {
    panelRef.current = node;
    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  }

  return (
    <div ref={setPanelRef} className="footer-products-panel" data-footer-panel>
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
          {isLoading
            ? Array.from({ length: FOOTER_TRENDING_LIMIT }, (_, index) => (
                <div
                  key={`footer-product-skeleton-${index}`}
                  className="footer-product-snippet footer-product-snippet--skeleton"
                  aria-hidden
                />
              ))
            : products.length === 0
              ? (
                <p className="footer-products-panel__empty">
                  Curated picks with live pricing will appear here soon.
                </p>
              )
              : products.map((product) => (
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
