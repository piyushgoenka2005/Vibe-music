"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { useProduct } from "@/hooks/useProduct";
import { useCartStore } from "@/store/cartStore";
import { useRecentlyViewedStore } from "@/store/recentlyViewedStore";
import { useWishlistStore } from "@/store/wishlistStore";
import {
  attributeKey,
  findVariantById,
  findVariantBySelection,
  getDefaultVariant,
} from "@/lib/variants";
import type { ProductImage, ProductVariant } from "@/types/product";
import type { ProductDetailResult } from "@/services/product.service";
import ProductGallery from "./ProductGallery";
import ProductInfo from "./ProductInfo";
import ShippingEstimator from "./ShippingEstimator";
import ProductTabs, { type TabId } from "./ProductTabs";
import FrequentlyBoughtTogether from "./FrequentlyBoughtTogether";
import ProductCrossSell from "./ProductCrossSell";
import GuitarSpecShowcase from "./GuitarSpecShowcase";
import GuitarTonesInMotion from "./GuitarTonesInMotion";
import GuitarStorySections from "./GuitarStorySections";
import ProductDetailSkeleton from "./ProductDetailSkeleton";
import { isGuitarProduct } from "@/lib/product/guitarShowcaseSpecs";
import { useProductReviewStats } from "@/hooks/useProductReviewStats";
import "./product-detail.css";

interface ProductDetailPageProps {
  slug: string;
  initialData?: ProductDetailResult | null;
}

function buildInitialSelection(variant: ProductVariant): Record<string, string> {
  const selection: Record<string, string> = {};
  variant.attributes.forEach((attr) => {
    selection[attributeKey(attr)] = attr.value;
  });
  return selection;
}

function buildGalleryImages(
  productImages: ProductImage[],
  variant: ProductVariant,
  productName: string,
  imageColor: string
): ProductImage[] {
  if (!variant.images.length) return productImages;

  const variantImages = variant.images.map((src, index) => ({
    id: `${variant.id}-img-${index}`,
    alt: `${productName} — ${variant.label}`,
    color: imageColor,
    src,
  }));

  return variantImages;
}

export default function ProductDetailPage({ slug, initialData }: ProductDetailPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabsRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, isError } = useProduct(slug, initialData);
  const { data: reviewStats } = useProductReviewStats(slug);
  const showSkeleton = isLoading && !data;
  const addItem = useCartStore((s) => s.addItem);
  const openCartDrawer = useCartStore((s) => s.openDrawer);
  const trackRecentlyViewed = useRecentlyViewedStore((s) => s.add);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) =>
    data ? s.has(data.product.id) : false
  );

  const catalogProduct = data?.product;
  const variantFromQuery = searchParams.get("variant");

  const defaultVariant = useMemo(() => {
    if (!catalogProduct) return null;
    return (
      findVariantById(catalogProduct.variants, variantFromQuery) ??
      getDefaultVariant(catalogProduct.variants)
    );
  }, [catalogProduct, variantFromQuery]);

  const [variantOverride, setVariantOverride] = useState<ProductVariant | null>(null);
  const [attributeOverride, setAttributeOverride] = useState<Record<string, string> | null>(
    null
  );
  const [quantity, setQuantity] = useState(1);
  const [tabOverride, setTabOverride] = useState<TabId | undefined>();

  const selectedVariant = variantOverride ?? defaultVariant;
  const attributeSelection =
    attributeOverride ??
    (selectedVariant ? buildInitialSelection(selectedVariant) : {});

  useEffect(() => {
    if (catalogProduct) {
      trackRecentlyViewed(catalogProduct);
    }
  }, [catalogProduct, trackRecentlyViewed]);

  const galleryImages = useMemo(() => {
    if (!catalogProduct || !selectedVariant) return [];
    return buildGalleryImages(
      catalogProduct.images,
      selectedVariant,
      catalogProduct.name,
      catalogProduct.imageColor
    );
  }, [catalogProduct, selectedVariant]);

  const updateVariantSelection = useCallback(
    (key: string, value: string) => {
      if (!catalogProduct) return;

      const nextSelection = { ...attributeSelection, [key]: value };
      const matched =
        findVariantBySelection(catalogProduct.variants, nextSelection) ??
        selectedVariant;

      if (!matched) return;

      setAttributeOverride(nextSelection);
      setVariantOverride(matched);
      setQuantity(1);

      const params = new URLSearchParams(searchParams.toString());
      params.set("variant", matched.id);
      router.replace(`/product/${slug}?${params.toString()}`, { scroll: false });
    },
    [attributeSelection, catalogProduct, router, searchParams, selectedVariant, slug]
  );

  if (showSkeleton) return <ProductDetailSkeleton />;

  if (isError || !data || !selectedVariant) {
    return (
      <div className="pdp">
        <p>Product not found.</p>
        <Link href={ROUTES.search}>Browse products</Link>
      </div>
    );
  }

  const variant = selectedVariant;
  const { product, similarProducts, relatedProducts } = data;

  function scrollToReviews() {
    setTabOverride("reviews");
    tabsRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function handleAddToCart() {
    addItem(product, quantity, variant);
    openCartDrawer();
  }

  function handleBuyNow() {
    addItem(product, quantity, variant);
    router.push("/checkout");
  }

  return (
    <>
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
          images={galleryImages}
          videos={product.videos}
          productName={product.name}
        />
        <div>
          <ProductInfo
            product={product}
            selectedVariant={variant}
            quantity={quantity}
            attributeSelection={attributeSelection}
            onAttributeChange={updateVariantSelection}
            onQuantityChange={setQuantity}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onToggleWishlist={() => toggleWishlist(product)}
            isWishlisted={isWishlisted}
            onReviewsClick={scrollToReviews}
            liveRating={reviewStats?.averageRating}
            liveReviewCount={reviewStats?.totalReviews}
          />
          <ShippingEstimator />
        </div>
      </div>

      <div ref={tabsRef}>
        <ProductTabs
          key={tabOverride ?? "description"}
          product={product}
          productSlug={slug}
          reviewCount={reviewStats?.totalReviews}
          initialTab={tabOverride}
        />
      </div>

      {data.bundle ? (
        <FrequentlyBoughtTogether
          mainProduct={product}
          mainVariant={variant}
          bundle={data.bundle}
        />
      ) : null}
      <ProductCrossSell title="Similar Products" products={similarProducts} />
      <ProductCrossSell title="Related Products" products={relatedProducts} />
      </div>

      {isGuitarProduct(product.categorySlug, product.category) ? (
        <>
          <GuitarSpecShowcase
            specs={product.specs}
            imageSrc={galleryImages[0]?.src ?? product.image}
            imageAlt={product.name}
          />
          <GuitarTonesInMotion />
          <GuitarStorySections />
        </>
      ) : null}
    </>
  );
}
