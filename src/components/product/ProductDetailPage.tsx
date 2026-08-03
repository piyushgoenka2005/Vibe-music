"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { useProduct } from "@/hooks/useProduct";
import { useCartStore } from "@/store/cartStore";
import {
  BUY_NOW_CHECKOUT_HREF,
  useBuyNowStore,
} from "@/store/buyNowStore";
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
import { isPurchasablePrice } from "@/utils/currency";
import { trackViewItem } from "@/lib/analytics/events";
import ProductGallery from "./ProductGallery";
import ProductInfo from "./ProductInfo";
import ProductBuyBox from "./ProductBuyBox";
import ProductRelatedRail from "./ProductRelatedRail";
import ProductDetailSkeleton from "./ProductDetailSkeleton";
import { isGuitarProduct } from "@/lib/product/guitarShowcaseSpecs";
import { isNonInstrumentGuitarProduct } from "@/lib/product/productRelevance";
import "./product-detail.css";

const FrequentlyBoughtTogether = dynamic(() => import("./FrequentlyBoughtTogether"), { ssr: false });
const GuitarSpecShowcase = dynamic(() => import("./GuitarSpecShowcase"), { ssr: false });
const GuitarTonesInMotion = dynamic(() => import("./GuitarTonesInMotion"), { ssr: false });
const GuitarStorySections = dynamic(() => import("./GuitarStorySections"), { ssr: false });
const ProductTabs = dynamic(() => import("./ProductTabs"), { ssr: false });
const ProductCrossSell = dynamic(() => import("./ProductCrossSell"), { ssr: false });
const ProductStickyBar = dynamic(() => import("./ProductStickyBar"), { ssr: false });

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

  const variantSrcs = new Set(variant.images);
  const extras = productImages.filter((img) => img.src && !variantSrcs.has(img.src));
  return [...variantImages, ...extras];
}

export default function ProductDetailPage({ slug, initialData }: ProductDetailPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const atcSentinelRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, isError } = useProduct(slug, initialData);
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
  const [dismissedRelatedIds, setDismissedRelatedIds] = useState<Set<string>>(
    () => new Set()
  );

  const selectedVariant = variantOverride ?? defaultVariant;
  const attributeSelection = useMemo(
    () =>
      attributeOverride ??
      (selectedVariant ? buildInitialSelection(selectedVariant) : {}),
    [attributeOverride, selectedVariant]
  );

  useEffect(() => {
    if (catalogProduct) {
      trackRecentlyViewed(catalogProduct);
    }
  }, [catalogProduct, trackRecentlyViewed]);

  useEffect(() => {
    if (!catalogProduct || !selectedVariant) return;
    trackViewItem(catalogProduct, {
      variantLabel: selectedVariant.label,
      value: selectedVariant.price ?? catalogProduct.price,
    });
  }, [catalogProduct, selectedVariant]);

  useEffect(() => {
    setDismissedRelatedIds(new Set());
  }, [slug]);

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

  if (isError || !data) {
    return (
      <div className="pdp">
        <p>Product not found.</p>
        <Link href={ROUTES.search}>Browse products</Link>
      </div>
    );
  }

  const variant =
    selectedVariant ??
    getDefaultVariant(data.product.variants) ??
    data.product.variants[0];

  if (!variant) {
    return (
      <div className="pdp">
        <p>This product is temporarily unavailable.</p>
        <Link href={ROUTES.search}>Browse products</Link>
      </div>
    );
  }

  const { product, similarProducts, relatedProducts } = data;
  const railProducts = [...relatedProducts, ...similarProducts]
    .filter(
      (item, index, items) =>
        item.id !== product.id &&
        items.findIndex((candidate) => candidate.id === item.id) === index &&
        !dismissedRelatedIds.has(item.id)
    )
    .slice(0, 4);
  const showRelatedRail = railProducts.length > 0;

  function dismissRelatedProduct(productId: string) {
    setDismissedRelatedIds((prev) => {
      const next = new Set(prev);
      next.add(productId);
      return next;
    });
  }

  function scrollToReviews() {
    document
      .getElementById("section-reviews")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleAddToCart() {
    if (!isPurchasablePrice(variant.price)) return;
    addItem(product, quantity, variant);
    openCartDrawer();
  }

  function handleBuyNow() {
    if (!isPurchasablePrice(variant.price)) return;
    const started = useBuyNowStore
      .getState()
      .startBuyNow(product, quantity, variant);
    if (!started) return;
    router.push(BUY_NOW_CHECKOUT_HREF);
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

      <div className={`pdp-main${showRelatedRail ? " pdp-main--with-rail" : ""}`}>
        <ProductGallery
          images={galleryImages}
          videos={product.videos}
          productName={product.name}
          productSlug={product.slug}
          spin360Images={product.spin360Images}
        />
        <div className="pdp-details">
          <ProductInfo
            product={product}
            selectedVariant={variant}
            attributeSelection={attributeSelection}
            onAttributeChange={updateVariantSelection}
            onReviewsClick={scrollToReviews}
            liveRating={product.rating}
            liveReviewCount={product.reviewCount}
          />
        </div>
        <div className="pdp-buy-cluster">
          <ProductBuyBox
            product={product}
            selectedVariant={variant}
            quantity={quantity}
            onQuantityChange={setQuantity}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onToggleWishlist={() => toggleWishlist(product)}
            isWishlisted={isWishlisted}
            atcSentinelRef={atcSentinelRef}
          />
        </div>
        {showRelatedRail ? (
          <ProductRelatedRail
            products={railProducts}
            onDismiss={dismissRelatedProduct}
          />
        ) : null}
      </div>

      <ProductTabs
        product={product}
        productSlug={slug}
        reviewCount={product.reviewCount}
      />

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

      {isGuitarProduct(product.categorySlug, product.category) &&
      !isNonInstrumentGuitarProduct(product) ? (
        <div className="pdp pdp--guitar-extensions">
          <GuitarSpecShowcase
            specs={product.specs}
            productName={product.name}
            brand={product.brand}
          />
          <GuitarTonesInMotion />
          <GuitarStorySections />
        </div>
      ) : null}

      <ProductStickyBar
        inStock={variant.availability !== "out-of-stock"}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        price={variant.price}
        productId={product.id}
        productSlug={product.slug}
        productName={product.name}
        sentinelRef={atcSentinelRef}
      />
    </>
  );
}
