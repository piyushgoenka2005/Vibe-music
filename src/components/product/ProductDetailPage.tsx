"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { useRouter } from "next/navigation";
import { useProduct } from "@/hooks/useProduct";
import { useCartStore } from "@/store/cartStore";
import { useRecentlyViewedStore } from "@/store/recentlyViewedStore";
import { useWishlistStore } from "@/store/wishlistStore";
import type { ProductVariant } from "@/types/product";
import ProductGallery from "./ProductGallery";
import ProductInfo from "./ProductInfo";
import ShippingEstimator from "./ShippingEstimator";
import ProductTabs, { type TabId } from "./ProductTabs";
import FrequentlyBoughtTogether from "./FrequentlyBoughtTogether";
import ProductCrossSell from "./ProductCrossSell";
import ProductDetailSkeleton from "./ProductDetailSkeleton";
import "./product-detail.css";

interface ProductDetailPageProps {
  slug: string;
}

export default function ProductDetailPage({ slug }: ProductDetailPageProps) {
  const router = useRouter();
  const tabsRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, isError } = useProduct(slug);
  const addItem = useCartStore((s) => s.addItem);
  const openCartDrawer = useCartStore((s) => s.openDrawer);
  const trackRecentlyViewed = useRecentlyViewedStore((s) => s.add);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) =>
    data ? s.has(data.product.id) : false
  );

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );
  const [quantity, setQuantity] = useState(1);
  const [tabOverride, setTabOverride] = useState<TabId | undefined>();

  useEffect(() => {
    if (data?.product) trackRecentlyViewed(data.product);
  }, [data?.product, trackRecentlyViewed]);

  if (isLoading) return <ProductDetailSkeleton />;

  if (isError || !data) {
    return (
      <div className="pdp">
        <p>Product not found.</p>
        <Link href={ROUTES.search}>Browse products</Link>
      </div>
    );
  }

  const { product, frequentlyBoughtTogether, similarProducts, relatedProducts } =
    data;
  const variant = selectedVariant ?? product.variants[0];

  function scrollToReviews() {
    setTabOverride("reviews");
    tabsRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function handleAddToCart() {
    addItem({ ...product, price: variant.price }, quantity);
    openCartDrawer();
  }

  function handleBuyNow() {
    addItem({ ...product, price: variant.price }, quantity);
    router.push("/checkout");
  }

  return (
    <div className="pdp">
      <nav className="pdp-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/category/${product.categorySlug}`}>
          {product.category}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className="pdp-main">
        <ProductGallery
          images={product.images}
          videos={product.videos}
          productName={product.name}
        />
        <div>
          <ProductInfo
            product={product}
            selectedVariant={variant}
            quantity={quantity}
            onVariantChange={setSelectedVariant}
            onQuantityChange={setQuantity}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onToggleWishlist={() => toggleWishlist(product)}
            isWishlisted={isWishlisted}
            onReviewsClick={scrollToReviews}
          />
          <ShippingEstimator />
        </div>
      </div>

      <div ref={tabsRef}>
        <ProductTabs
          key={tabOverride ?? "description"}
          product={product}
          initialTab={tabOverride}
        />
      </div>

      <FrequentlyBoughtTogether
        mainProduct={product}
        products={frequentlyBoughtTogether}
      />
      <ProductCrossSell title="Similar Products" products={similarProducts} />
      <ProductCrossSell title="Related Products" products={relatedProducts} />
    </div>
  );
}
