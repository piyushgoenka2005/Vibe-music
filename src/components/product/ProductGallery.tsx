"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Play } from "lucide-react";
import ProductShareButton from "@/components/product/ProductShareButton";
import {
  storefrontImageCandidates,
  storefrontZoomImageUrl,
} from "@/lib/storefrontImages";
import type { ProductImage, ProductVideo } from "@/types/product";
import Product360Viewer from "@/components/product/Product360Viewer";
import { useDialogA11y } from "@/hooks/useCartDrawerA11y";

const LENS_WIDTH_RATIO = 0.38;
const PANE_WIDTH = 560;
const PANE_MIN_WIDTH = 280;
const PANE_EXTRA_HEIGHT = 120;
const PANE_MAX_HEIGHT = 560;
const PANE_GAP = 12;
const HEADER_SAFE_TOP = 96;

interface ImageMetrics {
  naturalWidth: number;
  naturalHeight: number;
}

interface ImageRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const EMPTY_IMAGE_RECT: ImageRect = {
  left: 0,
  top: 0,
  width: 0,
  height: 0,
};

function readCssScale(element: HTMLElement): number {
  const transform = getComputedStyle(element).transform;
  if (!transform || transform === "none") return 1;

  const matrix2d = transform.match(/^matrix\((.+)\)$/);
  if (matrix2d?.[1]) {
    const parts = matrix2d[1].split(",").map((value) => Number.parseFloat(value.trim()));
    const scale = Math.hypot(parts[0] ?? 0, parts[1] ?? 0);
    return Number.isFinite(scale) && scale > 0 ? scale : 1;
  }

  const matrix3d = transform.match(/^matrix3d\((.+)\)$/);
  if (matrix3d?.[1]) {
    const parts = matrix3d[1].split(",").map((value) => Number.parseFloat(value.trim()));
    const scale = Math.hypot(parts[0] ?? 0, parts[1] ?? 0);
    return Number.isFinite(scale) && scale > 0 ? scale : 1;
  }

  return 1;
}

function measureRenderedImageRect(
  main: HTMLElement,
  photo: HTMLImageElement
): ImageRect {
  if (photo.naturalWidth <= 0 || photo.naturalHeight <= 0) {
    return EMPTY_IMAGE_RECT;
  }

  const mainRect = main.getBoundingClientRect();
  const photoRect = photo.getBoundingClientRect();
  const style = getComputedStyle(photo);
  const padLeft = parseFloat(style.paddingLeft) || 0;
  const padTop = parseFloat(style.paddingTop) || 0;
  const padRight = parseFloat(style.paddingRight) || 0;
  const padBottom = parseFloat(style.paddingBottom) || 0;
  const scale = readCssScale(photo);

  // Layout box (pre-transform). Visual center stays put with transform-origin: center.
  const layoutWidth = photo.offsetWidth;
  const layoutHeight = photo.offsetHeight;
  const visualCenterX = (photoRect.left + photoRect.right) / 2 - mainRect.left;
  const visualCenterY = (photoRect.top + photoRect.bottom) / 2 - mainRect.top;
  const layoutLeft = visualCenterX - layoutWidth / 2;
  const layoutTop = visualCenterY - layoutHeight / 2;

  const contentWidth = Math.max(photo.clientWidth - padLeft - padRight, 0);
  const contentHeight = Math.max(photo.clientHeight - padTop - padBottom, 0);
  if (contentWidth <= 0 || contentHeight <= 0) {
    return EMPTY_IMAGE_RECT;
  }

  const imageAspect = photo.naturalWidth / photo.naturalHeight;
  const contentAspect = contentWidth / contentHeight;

  let width = contentWidth;
  let height = contentHeight;

  if (imageAspect > contentAspect) {
    height = contentWidth / imageAspect;
  } else {
    width = contentHeight * imageAspect;
  }

  const unscaledLeft = layoutLeft + padLeft + (contentWidth - width) / 2;
  const unscaledTop = layoutTop + padTop + (contentHeight - height) / 2;
  const originX = layoutLeft + layoutWidth / 2;
  const originY = layoutTop + layoutHeight / 2;
  const unscaledCenterX = unscaledLeft + width / 2;
  const unscaledCenterY = unscaledTop + height / 2;
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;
  const scaledCenterX = originX + (unscaledCenterX - originX) * scale;
  const scaledCenterY = originY + (unscaledCenterY - originY) * scale;

  return {
    left: scaledCenterX - scaledWidth / 2,
    top: scaledCenterY - scaledHeight / 2,
    width: scaledWidth,
    height: scaledHeight,
  };
}

interface ProductGalleryProps {
  images: ProductImage[];
  videos: ProductVideo[];
  productName: string;
  productSlug: string;
  spin360Images?: string[];
}

interface LensPosition {
  x: number;
  y: number;
}

function GalleryThumb({ src }: { src: string }) {
  const candidates = useMemo(() => {
    const list = storefrontImageCandidates(src, 160);
    const medium = storefrontImageCandidates(src, 320);
    return Array.from(new Set([...list, ...medium, src].filter(Boolean)));
  }, [src]);
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const activeSrc = candidates[Math.min(attempt, candidates.length - 1)] ?? "";

  if (!activeSrc || failed) {
    return (
      <div className="pdp-gallery__thumb-placeholder" aria-hidden>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={activeSrc}
      src={activeSrc}
      alt=""
      width={48}
      height={48}
      loading="eager"
      decoding="async"
      className="pdp-gallery__thumb-photo"
      onError={() => {
        setAttempt((current) => {
          if (current + 1 < candidates.length) return current + 1;
          setFailed(true);
          return current;
        });
      }}
    />
  );
}

export default function ProductGallery({
  images,
  videos,
  productName,
  productSlug,
  spin360Images = [],
}: ProductGalleryProps) {
  const isMobileGallery = useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia("(max-width: 767px)");
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(max-width: 767px)").matches,
    () => false
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);
  const lightboxRef = useDialogA11y(lightboxOpen, closeLightbox);
  const [showVideo, setShowVideo] = useState(false);
  const [show360, setShow360] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const suppressNextClickRef = useRef(false);
  const [zoomActive, setZoomActive] = useState(false);
  const [lensPos, setLensPos] = useState<LensPosition>({ x: 0, y: 0 });
  const [mainSize, setMainSize] = useState({ width: 0, height: 0 });
  const [paneSize, setPaneSize] = useState({ width: 0, height: 0 });
  const [paneOffset, setPaneOffset] = useState({ top: 0, left: 0 });
  const [zoomSpaceOk, setZoomSpaceOk] = useState(false);
  const [imageMetrics, setImageMetrics] = useState<ImageMetrics>({
    naturalWidth: 0,
    naturalHeight: 0,
  });
  const [imageRect, setImageRect] = useState<ImageRect>(EMPTY_IMAGE_RECT);

  const mainRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLImageElement>(null);
  const paneRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);

  const activeImage = images[activeIndex] ?? images[0];
  const zoomEligible =
    Boolean(activeImage?.src) && !showVideo && !show360;
  const canZoom = zoomEligible && zoomSpaceOk;
  const has360 = spin360Images.length >= 2;
  const activeSrc = activeImage?.src ?? "";
  const displayCandidates = useMemo(() => {
    // Thumb API is most reliable (local Sharp proxy); try large first,
    // then medium fallback, then CDN master as last resort.
    const large = storefrontImageCandidates(activeSrc, 1200);
    const medium = storefrontImageCandidates(activeSrc, 640);
    return Array.from(
      new Set([...large, ...medium, activeSrc].filter(Boolean))
    );
  }, [activeSrc]);
  const [displayAttempt, setDisplayAttempt] = useState(0);
  const [allFailed, setAllFailed] = useState(false);
  const [activeSrcKey, setActiveSrcKey] = useState(activeSrc);
  if (activeSrc !== activeSrcKey) {
    setActiveSrcKey(activeSrc);
    setDisplayAttempt(0);
    setAllFailed(false);
  }
  const safeDisplayAttempt =
    activeSrc === activeSrcKey ? displayAttempt : 0;
  const activeDisplaySrc =
    displayCandidates[
      Math.min(safeDisplayAttempt, displayCandidates.length - 1)
    ] ?? "";
  const activeZoomSrc = activeSrc ? storefrontZoomImageUrl(activeSrc) : "";

  const measureImageRect = useCallback(() => {
    const main = mainRef.current;
    const photo = photoRef.current;
    if (!main || !photo) return;
    setImageRect(measureRenderedImageRect(main, photo));
  }, []);

  const placeZoomPane = useCallback(() => {
    const main = mainRef.current;
    if (!main || typeof window === "undefined") return;

    const rect = main.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const spaceRight = viewportWidth - rect.right - PANE_GAP - 12;
    const spaceLeft = rect.left - PANE_GAP - 12;

    // Prefer the right side; fall back to left. If neither fits, disable zoom
    // instead of sliding a huge pane over the gallery/header.
    const side: "right" | "left" | "none" =
      spaceRight >= PANE_MIN_WIDTH
        ? "right"
        : spaceLeft >= PANE_MIN_WIDTH
          ? "left"
          : "none";

    if (side === "none" || viewportWidth < 1024) {
      setZoomSpaceOk(false);
      setZoomActive(false);
      setPaneSize({ width: 0, height: 0 });
      return;
    }

    const available = side === "right" ? spaceRight : spaceLeft;
    const width = Math.min(PANE_WIDTH, Math.floor(available));
    const height = Math.min(
      PANE_MAX_HEIGHT,
      Math.round(rect.height + PANE_EXTRA_HEIGHT),
      Math.max(240, viewportHeight - HEADER_SAFE_TOP - 24)
    );
    const left =
      side === "right" ? rect.right + PANE_GAP : rect.left - PANE_GAP - width;
    const top = Math.min(
      Math.max(HEADER_SAFE_TOP, rect.top),
      Math.max(HEADER_SAFE_TOP, viewportHeight - height - 12)
    );

    setZoomSpaceOk(true);
    setPaneOffset({ top, left });
    setPaneSize({ width, height });
  }, []);

  const effectivePaneSize = useMemo(() => {
    if (paneSize.width > 0 && paneSize.height > 0) {
      return paneSize;
    }

    const height =
      mainSize.height > 0
        ? Math.min(PANE_MAX_HEIGHT, Math.round(mainSize.height + PANE_EXTRA_HEIGHT))
        : 420;
    return { width: Math.min(PANE_WIDTH, PANE_MIN_WIDTH + 80), height };
  }, [mainSize.height, paneSize]);

  const lensDimensions = useMemo(() => {
    const baseWidth = imageRect.width > 0 ? imageRect.width : mainSize.width;

    if (baseWidth <= 0) {
      return { width: 280, height: 210 };
    }

    const paneAspect =
      effectivePaneSize.height > 0
        ? effectivePaneSize.width / effectivePaneSize.height
        : 4 / 3;
    let width = Math.round(baseWidth * LENS_WIDTH_RATIO);
    let height = Math.round(width / paneAspect);

    // Keep magnification near native resolution so the zoom pane stays sharp.
    if (
      imageMetrics.naturalWidth > 0 &&
      baseWidth > 0 &&
      effectivePaneSize.width > 0
    ) {
      const maxScale = Math.max(
        1.15,
        (imageMetrics.naturalWidth * 1.2) / baseWidth
      );
      const minLensWidth = Math.ceil(effectivePaneSize.width / maxScale);
      if (width < minLensWidth && minLensWidth < baseWidth) {
        width = minLensWidth;
        height = Math.round(width / paneAspect);
      }
    }

    return { width, height };
  }, [
    effectivePaneSize.height,
    effectivePaneSize.width,
    imageMetrics.naturalWidth,
    imageRect.width,
    mainSize.width,
  ]);

  const zoomScale = useMemo(() => {
    if (
      lensDimensions.width <= 0 ||
      lensDimensions.height <= 0 ||
      effectivePaneSize.width <= 0 ||
      effectivePaneSize.height <= 0
    ) {
      return { x: 2.5, y: 2.5 };
    }

    return {
      x: effectivePaneSize.width / lensDimensions.width,
      y: effectivePaneSize.height / lensDimensions.height,
    };
  }, [
    effectivePaneSize.height,
    effectivePaneSize.width,
    lensDimensions.height,
    lensDimensions.width,
  ]);

  useEffect(() => {
    const node = mainRef.current;
    if (!node) return;

    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      setMainSize({ width: rect.width, height: rect.height });
      measureImageRect();
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, [activeIndex, measureImageRect, showVideo]);

  // Keep zoom availability in sync with layout; do not wait for hover.
  useLayoutEffect(() => {
    if (!zoomEligible) {
      setZoomSpaceOk(false);
      setZoomActive(false);
      return;
    }

    placeZoomPane();
    window.addEventListener("resize", placeZoomPane);
    window.addEventListener("scroll", placeZoomPane, true);
    return () => {
      window.removeEventListener("resize", placeZoomPane);
      window.removeEventListener("scroll", placeZoomPane, true);
    };
  }, [
    activeIndex,
    mainSize.height,
    mainSize.width,
    placeZoomPane,
    showVideo,
    show360,
    zoomEligible,
  ]);

  useEffect(() => {
    const node = paneRef.current;
    if (!node || !zoomActive) return;

    const updatePaneSize = () => {
      const rect = node.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setPaneSize({ width: rect.width, height: rect.height });
      }
    };

    updatePaneSize();
    const observer = new ResizeObserver(updatePaneSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, [activeIndex, showVideo, zoomActive, paneOffset.left, paneOffset.top]);

  useEffect(() => {
    queueMicrotask(() => {
      setImageMetrics({ naturalWidth: 0, naturalHeight: 0 });
      setImageRect(EMPTY_IMAGE_RECT);
    });
  }, [activeIndex, activeImage?.src]);

  useEffect(() => {
    if (!imageMetrics.naturalWidth) return;
    measureImageRect();
  }, [imageMetrics.naturalWidth, imageMetrics.naturalHeight, measureImageRect]);

  // Keep the active thumbnail visible in the mobile horizontal strip.
  useEffect(() => {
    const strip = thumbsRef.current;
    if (!strip) return;
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 768px)").matches) return;

    const active = strip.querySelector<HTMLElement>(
      ".pdp-gallery__thumb--active"
    );
    if (!active) return;

    active.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeIndex, showVideo, show360]);

  useEffect(() => {
    if (!lightboxOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [lightboxOpen]);

  const updateLens = useCallback(
    (clientX: number, clientY: number) => {
      const node = mainRef.current;
      const photo = photoRef.current;
      if (!node || !canZoom) return;

      // Remeasure each move so CSS photo scale stays synced with the lens.
      const nextRect =
        photo && photo.naturalWidth > 0
          ? measureRenderedImageRect(node, photo)
          : imageRect;
      if (
        nextRect.width > 0 &&
        (nextRect.width !== imageRect.width ||
          nextRect.height !== imageRect.height ||
          nextRect.left !== imageRect.left ||
          nextRect.top !== imageRect.top)
      ) {
        setImageRect(nextRect);
      }

      const activeRect = nextRect.width > 0 ? nextRect : imageRect;
      const rect = node.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const { width: lensWidth, height: lensHeight } = lensDimensions;
      const minX = activeRect.left;
      const minY = activeRect.top;
      const maxX = Math.max(minX, activeRect.left + activeRect.width - lensWidth);
      const maxY = Math.max(minY, activeRect.top + activeRect.height - lensHeight);

      setLensPos({
        x: Math.min(Math.max(x - lensWidth / 2, minX), maxX),
        y: Math.min(Math.max(y - lensHeight / 2, minY), maxY),
      });
    },
    [canZoom, imageRect, lensDimensions]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!canZoom) return;
      updateLens(e.clientX, e.clientY);
    },
    [canZoom, updateLens]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
        return;
      }
      const touch = e.touches[0];
      if (!touch) return;
      updateLens(touch.clientX, touch.clientY);
    },
    [updateLens]
  );

  const openLightbox = useCallback(() => {
    setZoomActive(false);
    setLightboxOpen(true);
  }, []);

  if (!activeImage && !has360) {
    return (
      <div className="pdp-gallery" aria-label={`${productName} image gallery`}>
        <div className="pdp-gallery__stage">
          <div className="pdp-gallery__main">
            <div
              className="pdp-gallery__swatch"
              style={{ backgroundColor: "#e8e7e6" }}
              role="img"
              aria-label={`${productName} placeholder`}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!activeImage && has360) {
    return (
      <div className="pdp-gallery" aria-label={`${productName} image gallery`}>
        <div className="pdp-gallery__stage">
          <div className="pdp-gallery__main">
            <div className="pdp-gallery__main-inner">
              <Product360Viewer frames={spin360Images} productName={productName} />
            </div>
          </div>
        </div>
        <button
          type="button"
          className="pdp-gallery__video-btn pdp-gallery__video-btn--active"
          aria-pressed
        >
          360° View
        </button>
      </div>
    );
  }

  return (
    <div className="pdp-gallery" aria-label={`${productName} image gallery`}>
      <div
        ref={thumbsRef}
        className="pdp-gallery__thumbs"
        role="list"
        aria-label="Product thumbnails"
      >
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            role="listitem"
            className={`pdp-gallery__thumb${index === activeIndex && !showVideo && !show360 ? " pdp-gallery__thumb--active" : ""}`}
            onMouseEnter={() => {
              setShowVideo(false);
              setShow360(false);
              setActiveIndex(index);
            }}
            onFocus={() => {
              setShowVideo(false);
              setShow360(false);
              setActiveIndex(index);
            }}
            onClick={() => {
              setShowVideo(false);
              setShow360(false);
              setActiveIndex(index);
            }}
            aria-label={image.alt}
            aria-current={index === activeIndex && !showVideo && !show360}
          >
            {image.src ? (
              <GalleryThumb src={image.src} />
            ) : (
              <div
                className="pdp-gallery__thumb-swatch"
                style={{ backgroundColor: image.color }}
              />
            )}
          </button>
        ))}
        {videos.map((video) => (
          <button
            key={video.id}
            type="button"
            className={`pdp-gallery__thumb${showVideo ? " pdp-gallery__thumb--active" : ""}`}
            onClick={() => setShowVideo(true)}
            aria-label={`Play video: ${video.title}`}
          >
            <div
              className="pdp-gallery__thumb-swatch pdp-gallery__thumb-swatch--video"
              style={{ backgroundColor: video.thumbnailColor }}
            >
              <Play size={18} color="#fff" fill="#fff" />
            </div>
          </button>
        ))}
      </div>

      <div
        ref={stageRef}
        className={`pdp-gallery__stage${zoomActive && canZoom ? " pdp-gallery__stage--zooming" : ""}`}
      >
        <div
          ref={mainRef}
          className={`pdp-gallery__main${zoomActive && canZoom ? " pdp-gallery__main--zooming" : ""}`}
          onMouseEnter={() => {
            if (!zoomEligible) return;
            placeZoomPane();
            measureImageRect();
            // placeZoomPane updates zoomSpaceOk; only activate if space remains.
            const main = mainRef.current;
            if (!main || typeof window === "undefined") return;
            const rect = main.getBoundingClientRect();
            const spaceRight = window.innerWidth - rect.right - PANE_GAP - 12;
            const spaceLeft = rect.left - PANE_GAP - 12;
            if (
              window.innerWidth < 1024 ||
              (spaceRight < PANE_MIN_WIDTH && spaceLeft < PANE_MIN_WIDTH)
            ) {
              return;
            }
            setZoomActive(true);
          }}
          onMouseLeave={() => setZoomActive(false)}
          onMouseMove={onMouseMove}
          onTouchStart={(e) => {
            setTouchStartX(e.touches[0]?.clientX ?? null);
          }}
          onTouchMove={onTouchMove}
          onTouchEnd={(e) => {
            setZoomActive(false);
            const touch = e.changedTouches[0];
            const endX = touch?.clientX ?? touchStartX;
            if (touchStartX == null || endX == null) {
              setTouchStartX(null);
              return;
            }

            const diff = endX - touchStartX;

            if (Math.abs(diff) > 48 && images.length > 1) {
              setActiveIndex((current) => {
                if (diff < 0) return Math.min(images.length - 1, current + 1);
                return Math.max(0, current - 1);
              });
              setShowVideo(false);
              if (isMobileGallery) suppressNextClickRef.current = true;
            } else if (isMobileGallery && Math.abs(diff) < 12) {
              openLightbox();
              suppressNextClickRef.current = true;
            }

            setTouchStartX(null);
          }}
          onTouchCancel={() => {
            setZoomActive(false);
            setTouchStartX(null);
          }}
          onClick={() => {
            if (suppressNextClickRef.current) {
              suppressNextClickRef.current = false;
              return;
            }
            if (isMobileGallery) {
              openLightbox();
            }
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openLightbox();
            }
          }}
          aria-label={
            isMobileGallery
              ? "Tap to enlarge product image"
              : canZoom
                ? "Hover to zoom product image"
                : "Product image"
          }
        >
          <ProductShareButton
            overlay
            position="top-right"
            title={productName}
            url={`/product/${productSlug}`}
            text={`Check out ${productName} at Vibe Music`}
            size={18}
            className="pdp-gallery__share"
          />
          <div className="pdp-gallery__main-inner">
            {show360 && has360 ? (
              <Product360Viewer frames={spin360Images} productName={productName} />
            ) : showVideo && videos[0] ? (
              <div className="pdp-video-embed pdp-video-embed--gallery">
                <iframe
                  src={videos[0].embedUrl}
                  title={videos[0].title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : activeDisplaySrc && !allFailed ? (
              // Plain img — next/image fill was painting broken icons on thumb API
              // races; match homepage fallback chain (thumb → CDN master).
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={activeDisplaySrc}
                ref={photoRef}
                src={activeDisplaySrc}
                alt={activeImage.alt}
                className="pdp-gallery__photo"
                draggable={false}
                decoding="async"
                fetchPriority="high"
                onLoad={(event) => {
                  const image = event.currentTarget;
                  setImageMetrics({
                    naturalWidth: image.naturalWidth,
                    naturalHeight: image.naturalHeight,
                  });
                  measureImageRect();
                }}
                onError={() => {
                  setDisplayAttempt((current) => {
                    if (current + 1 < displayCandidates.length) {
                      return current + 1;
                    }
                    setAllFailed(true);
                    return current;
                  });
                }}
              />
            ) : (
              <div
                className="pdp-gallery__swatch pdp-gallery__swatch--placeholder"
                style={{ backgroundColor: activeImage.color || "#f0f0f0" }}
                role="img"
                aria-label={activeImage.alt}
              >
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            )}
          </div>

          {zoomActive && canZoom ? (
            <div
              className="pdp-gallery__zoom-lens"
              style={{
                width: lensDimensions.width,
                height: lensDimensions.height,
                transform: `translate(${lensPos.x}px, ${lensPos.y}px)`,
              }}
              aria-hidden
            />
          ) : null}
        </div>

        {zoomEligible ? (
          <button
            type="button"
            className="pdp-gallery__full-view"
            onClick={(e) => {
              e.stopPropagation();
              openLightbox();
            }}
            aria-label="Open full view"
          >
            Click to see full view
          </button>
        ) : null}

        {zoomActive && canZoom && mainSize.width > 0 ? (
          <div
            ref={paneRef}
            className="pdp-gallery__zoom-pane"
            aria-hidden
            style={{
              top: paneOffset.top,
              left: paneOffset.left,
              width: paneSize.width > 0 ? paneSize.width : undefined,
              height: paneSize.height > 0 ? paneSize.height : undefined,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- zoom lens needs raw img + onError swap */}
            <img
              src={activeZoomSrc || activeDisplaySrc}
              alt=""
              className="pdp-gallery__zoom-image"
              draggable={false}
              onError={(event) => {
                const target = event.currentTarget;
                if (activeSrc && target.src !== activeSrc) {
                  target.src = activeSrc;
                }
              }}
              style={{
                width:
                  Math.max(imageRect.width > 0 ? imageRect.width : mainSize.width, 1) *
                  zoomScale.x,
                height:
                  Math.max(
                    imageRect.height > 0 ? imageRect.height : mainSize.height,
                    1
                  ) * zoomScale.y,
                transform: `translate(${-(lensPos.x - imageRect.left) * zoomScale.x}px, ${-(lensPos.y - imageRect.top) * zoomScale.y}px)`,
              }}
            />
          </div>
        ) : null}
      </div>

      {has360 ? (
        <button
          type="button"
          className={`pdp-gallery__video-btn${show360 ? " pdp-gallery__video-btn--active" : ""}`}
          onClick={() => {
            setShow360(true);
            setShowVideo(false);
            setZoomActive(false);
          }}
          aria-pressed={show360}
        >
          360° View
        </button>
      ) : null}

      {videos.length > 0 ? (
        <button
          type="button"
          className="pdp-gallery__video-btn"
          onClick={() => {
            setShowVideo(true);
            setShow360(false);
          }}
        >
          <Play size={16} />
          Watch Product Video
        </button>
      ) : null}

      {lightboxOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={lightboxRef as RefObject<HTMLDivElement>}
              className="pdp-lightbox"
              role="dialog"
              aria-modal="true"
              aria-label="Image lightbox"
              onClick={closeLightbox}
              onTouchStart={(e) => setTouchStartX(e.touches[0]?.clientX ?? null)}
              onTouchEnd={(e) => {
                if (touchStartX == null || images.length <= 1) {
                  setTouchStartX(null);
                  return;
                }
                const endX = e.changedTouches[0]?.clientX ?? touchStartX;
                const diff = endX - touchStartX;
                if (Math.abs(diff) > 48) {
                  setActiveIndex((current) => {
                    if (diff < 0) return Math.min(images.length - 1, current + 1);
                    return Math.max(0, current - 1);
                  });
                  setShowVideo(false);
                }
                setTouchStartX(null);
              }}
            >
              <button
                type="button"
                className="pdp-lightbox__close"
                onClick={(e) => {
                  e.stopPropagation();
                  closeLightbox();
                }}
                aria-label="Close lightbox"
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
              {images.length > 1 ? (
                <>
                  <button
                    type="button"
                    className="pdp-lightbox__nav pdp-lightbox__nav--prev"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveIndex((current) => Math.max(0, current - 1));
                      setShowVideo(false);
                    }}
                    aria-label="Previous image"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="pdp-lightbox__nav pdp-lightbox__nav--next"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveIndex((current) =>
                        Math.min(images.length - 1, current + 1)
                      );
                      setShowVideo(false);
                    }}
                    aria-label="Next image"
                  >
                    ›
                  </button>
                </>
              ) : null}
              <div
                className="pdp-lightbox__swatch"
                onClick={(e) => e.stopPropagation()}
                role="img"
                aria-label={activeImage.alt}
              >
                {activeZoomSrc || activeDisplaySrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activeZoomSrc || activeDisplaySrc}
                    alt={activeImage.alt}
                    className="pdp-lightbox__photo"
                    onError={(event) => {
                      const target = event.currentTarget;
                      if (activeSrc && target.src !== activeSrc) {
                        target.src = activeSrc;
                      }
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: activeImage.color,
                    }}
                  />
                )}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
