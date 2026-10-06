"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { useProduct } from "@/hooks/useProduct";
import { useProductInitialData } from "@/hooks/useProductInitialData";
import { useCartStore } from "@/store/cartStore";
import { BUY_NOW_CHECKOUT_HREF, useBuyNowStore } from "@/store/buyNowStore";
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
import ProductStickyBar from "./ProductStickyBar";
import ProductDetailSkeleton from "./ProductDetailSkeleton";
import { isGuitarProduct } from "@/lib/product/guitarShowcaseSpecs";
import { isNonInstrumentGuitarProduct } from "@/lib/product/productRelevance";
import { buildProductBreadcrumb } from "@/lib/product/productBreadcrumb";
import "./product-detail.css";

const FrequentlyBoughtTogether = dynamic(() => import("./FrequentlyBoughtTogether"), {
  ssr: false,
});
const GuitarSpecShowcase = dynamic(() => import("./GuitarSpecShowcase"), { ssr: false });
const GuitarTonesInMotion = dynamic(() => import("./GuitarTonesInMotion"), { ssr: false });
const GuitarStorySections = dynamic(() => import("./GuitarStorySections"), { ssr: false });
const ProductTabs = dynamic(() => import("./ProductTabs"));
const ProductCrossSell = dynamic(() => import("./ProductCrossSell"), { ssr: false });

interface ProductDetailPageProps {
  slug: string;
  initialData?: ProductDetailResult | null;
  shippingDetail?: string;
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
  imageColor: string,
): ProductImage[] {
  const extractSrc = (item: unknown): string => {
    if (!item) return "";
    if (typeof item === "string") return item === "[object Object]" ? "" : item;
    if (typeof item === "object") {
      const candidate = item as { src?: unknown; url?: unknown };
      if (typeof candidate.src === "string") {
        return candidate.src === "[object Object]" ? "" : candidate.src;
      }
      if (typeof candidate.url === "string") {
        return candidate.url === "[object Object]" ? "" : candidate.url;
      }
    }
    return "";
  };

  const rawVariantImages = Array.isArray(variant?.images) ? variant.images : [];
  const variantImages: ProductImage[] = rawVariantImages
    .map((raw, index) => {
      const src = extractSrc(raw);
      return {
        id: `${variant.id}-img-${index}`,
        alt: `${productName} — ${variant.label}`,
        color: imageColor,
        src,
      };
    })
    .filter((img) => Boolean(img.src));

  const normalizedProductImages: ProductImage[] = (
    Array.isArray(productImages) ? productImages : []
  )
    .map((img, index) => {
      const candidate = img as unknown;
      const src = extractSrc(
        typeof candidate === "string"
          ? candidate
          : ((candidate as { src?: unknown })?.src ?? candidate),
      );
      const imgObj =
        typeof candidate === "object" && candidate !== null
          ? (candidate as Record<string, unknown>)
          : null;
      return {
        id: (typeof imgObj?.id === "string" && imgObj.id) || `img-${index}`,
        alt: (typeof imgObj?.alt === "string" && imgObj.alt) || `${productName} view ${index + 1}`,
        color: (typeof imgObj?.color === "string" && imgObj.color) || imageColor,
        src,
      };
    })
    .filter((img) => Boolean(img.src));

  if (!variantImages.length) return normalizedProductImages;

  const variantSrcs = new Set(variantImages.map((img) => img.src));
  const extras = normalizedProductImages.filter((img) => img.src && !variantSrcs.has(img.src));
  return [...variantImages, ...extras];
}

export default function ProductDetailPage(props: ProductDetailPageProps) {
  if (props.initialData?.product) {
    return (
      <ProductDetailPageWithInitialData
        key={props.slug}
        slug={props.slug}
        initialData={props.initialData}
        shippingDetail={props.shippingDetail}
      />
    );
  }

  return <ProductDetailPageWithQuery slug={props.slug} shippingDetail={props.shippingDetail} />;
}

function ProductDetailPageWithInitialData({
  slug,
  initialData,
  shippingDetail,
}: ProductDetailPageProps & { initialData: ProductDetailResult }) {
  const { data, isError } = useProductInitialData(slug, initialData);

  return (
    <ProductDetailPageContent
      slug={slug}
      data={data}
      isLoading={false}
      isError={isError}
      shippingDetail={shippingDetail}
    />
  );
}

function ProductDetailPageWithQuery({ slug, shippingDetail }: ProductDetailPageProps) {
  const { data, isLoading, isError } = useProduct(slug);

  return (
    <ProductDetailPageContent
      slug={slug}
      data={data}
      isLoading={isLoading}
      isError={isError}
      shippingDetail={shippingDetail}
    />
  );
}

function ProductDetailPageContent({
  slug,
  data,
  isLoading,
  isError,
  shippingDetail,
}: {
  slug: string;
  data?: ProductDetailResult | null;
  isLoading: boolean;
  isError: boolean;
  shippingDetail?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const atcSentinelRef = useRef<HTMLDivElement>(null);
  const showSkeleton = isLoading && !data;
  const addItem = useCartStore((s) => s.addItem);
  const openCartDrawer = useCartStore((s) => s.openDrawer);
  const trackRecentlyViewed = useRecentlyViewedStore((s) => s.add);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => (data ? s.has(data.product.id) : false));

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
  const [attributeOverride, setAttributeOverride] = useState<Record<string, string> | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [dismissedRelatedIds, setDismissedRelatedIds] = useState<Set<string>>(() => new Set());

  const selectedVariant = variantOverride ?? defaultVariant;
  const attributeSelection = useMemo(
    () => attributeOverride ?? (selectedVariant ? buildInitialSelection(selectedVariant) : {}),
    [attributeOverride, selectedVariant],
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
      catalogProduct.imageColor,
    );
  }, [catalogProduct, selectedVariant]);

  const updateVariantSelection = useCallback(
    (key: string, value: string) => {
      if (!catalogProduct) return;

      const nextSelection = { ...attributeSelection, [key]: value };
      const matched =
        findVariantBySelection(catalogProduct.variants, nextSelection) ?? selectedVariant;

      if (!matched) return;

      setAttributeOverride(nextSelection);
      setVariantOverride(matched);
      setQuantity(1);

      const params = new URLSearchParams(searchParams.toString());
      params.set("variant", matched.id);
      router.replace(`/product/${slug}?${params.toString()}`, { scroll: false });
    },
    [attributeSelection, catalogProduct, router, searchParams, selectedVariant, slug],
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
    selectedVariant ?? getDefaultVariant(data.product.variants) ?? data.product.variants[0];

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
        !dismissedRelatedIds.has(item.id),
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
    const started = useBuyNowStore.getState().startBuyNow(product, quantity, variant);
    if (!started) return;
    router.push(BUY_NOW_CHECKOUT_HREF);
  }

  return (
    <>
      <div className="pdp">
        <nav className="pdp-breadcrumb" aria-label="Breadcrumb">
          {buildProductBreadcrumb(product).map((crumb, index) => (
            <Fragment key={`${crumb.label}-${index}`}>
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {crumb.href ? (
                <Link href={crumb.href}>{crumb.label}</Link>
              ) : (
                <span aria-current="page">{crumb.label}</span>
              )}
            </Fragment>
          ))}
        </nav>

        <div className={`pdp-main${showRelatedRail ? " pdp-main--with-rail" : ""}`}>
          <ProductGallery
            images={galleryImages}
            videos={product.videos}
            productName={product.name}
            productSlug={product.slug}
            productCategory={product.category}
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
              shippingDetail={shippingDetail}
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
            <ProductRelatedRail products={railProducts} onDismiss={dismissRelatedProduct} />
          ) : null}
        </div>

        <ProductTabs product={product} productSlug={slug} reviewCount={product.reviewCount} />

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
        price={variant.price}
        productId={product.id}
        productSlug={product.slug}
        productName={product.name}
        inStock={variant.availability !== "out-of-stock"}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        sentinelRef={atcSentinelRef}
      />
    </>
  );
}
