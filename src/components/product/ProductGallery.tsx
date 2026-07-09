"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Play } from "lucide-react";
import ProductShareButton from "@/components/product/ProductShareButton";
import type { ProductImage, ProductVideo } from "@/types/product";

const LENS_WIDTH_RATIO = 0.38;
const PANE_WIDTH = 680;
const PANE_MIN_WIDTH = 480;
const PANE_EXTRA_HEIGHT = 240;
const PANE_MAX_HEIGHT = 680;

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

  const contentWidth = photo.clientWidth - padLeft - padRight;
  const contentHeight = photo.clientHeight - padTop - padBottom;
  const imageAspect = photo.naturalWidth / photo.naturalHeight;
  const contentAspect = contentWidth / contentHeight;

  let width = contentWidth;
  let height = contentHeight;

  if (imageAspect > contentAspect) {
    height = contentWidth / imageAspect;
  } else {
    width = contentHeight * imageAspect;
  }

  const contentLeft = photoRect.left - mainRect.left + padLeft;
  const contentTop = photoRect.top - mainRect.top + padTop;

  return {
    left: contentLeft + (contentWidth - width) / 2,
    top: contentTop + (contentHeight - height) / 2,
    width,
    height,
  };
}

interface ProductGalleryProps {
  images: ProductImage[];
  videos: ProductVideo[];
  productName: string;
  productSlug: string;
}

interface LensPosition {
  x: number;
  y: number;
}

export default function ProductGallery({
  images,
  videos,
  productName,
  productSlug,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [zoomActive, setZoomActive] = useState(false);
  const [lensPos, setLensPos] = useState<LensPosition>({ x: 0, y: 0 });
  const [mainSize, setMainSize] = useState({ width: 0, height: 0 });
  const [paneSize, setPaneSize] = useState({ width: 0, height: 0 });
  const [imageMetrics, setImageMetrics] = useState<ImageMetrics>({
    naturalWidth: 0,
    naturalHeight: 0,
  });
  const [imageRect, setImageRect] = useState<ImageRect>(EMPTY_IMAGE_RECT);

  const mainRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLImageElement>(null);
  const paneRef = useRef<HTMLDivElement>(null);

  const activeImage = images[activeIndex] ?? images[0];
  const canZoom = Boolean(activeImage?.src) && !showVideo;

  const measureImageRect = useCallback(() => {
    const main = mainRef.current;
    const photo = photoRef.current;
    if (!main || !photo) return;
    setImageRect(measureRenderedImageRect(main, photo));
  }, []);

  const effectivePaneSize = useMemo(() => {
    if (paneSize.width > 0 && paneSize.height > 0) {
      return paneSize;
    }

    const height =
      mainSize.height > 0
        ? Math.min(PANE_MAX_HEIGHT, Math.round(mainSize.height + PANE_EXTRA_HEIGHT))
        : 640;
    const viewportWidth =
      typeof window !== "undefined" ? window.innerWidth : 1280;
    const width = Math.min(
      PANE_WIDTH,
      Math.max(PANE_MIN_WIDTH, Math.round(viewportWidth * 0.5 - 48))
    );

    return { width, height };
  }, [mainSize.height, paneSize.height, paneSize.width]);

  const lensDimensions = useMemo(() => {
    const baseWidth = imageRect.width > 0 ? imageRect.width : mainSize.width;

    if (baseWidth <= 0) {
      return { width: 280, height: 210 };
    }

    const paneAspect = effectivePaneSize.width / effectivePaneSize.height;
    const width = Math.round(baseWidth * LENS_WIDTH_RATIO);
    const height = Math.round(width / paneAspect);
    return { width, height };
  }, [
    effectivePaneSize.height,
    effectivePaneSize.width,
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

  useEffect(() => {
    const node = paneRef.current;
    if (!node || !zoomActive) return;

    const updatePaneSize = () => {
      const rect = node.getBoundingClientRect();
      setPaneSize({ width: rect.width, height: rect.height });
    };

    updatePaneSize();
    const observer = new ResizeObserver(updatePaneSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, [activeIndex, showVideo, zoomActive]);

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

  const updateLens = useCallback(
    (clientX: number, clientY: number) => {
      const node = mainRef.current;
      if (!node || !canZoom) return;

      const rect = node.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const { width: lensWidth, height: lensHeight } = lensDimensions;
      const minX = imageRect.left;
      const minY = imageRect.top;
      const maxX = Math.max(minX, imageRect.left + imageRect.width - lensWidth);
      const maxY = Math.max(minY, imageRect.top + imageRect.height - lensHeight);

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
      const touch = e.touches[0];
      if (!touch) return;
      updateLens(touch.clientX, touch.clientY);
    },
    [updateLens]
  );

  const openLightbox = useCallback(() => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      setLightboxOpen(true);
    }
  }, []);

  return (
    <div className="pdp-gallery" aria-label={`${productName} image gallery`}>
      <div className="pdp-gallery__thumbs" role="list" aria-label="Product thumbnails">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            role="listitem"
            className={`pdp-gallery__thumb${index === activeIndex && !showVideo ? " pdp-gallery__thumb--active" : ""}`}
            onMouseEnter={() => {
              setShowVideo(false);
              setActiveIndex(index);
            }}
            onFocus={() => {
              setShowVideo(false);
              setActiveIndex(index);
            }}
            onClick={() => {
              setShowVideo(false);
              setActiveIndex(index);
            }}
            aria-label={image.alt}
            aria-current={index === activeIndex && !showVideo}
          >
            {image.src ? (
              <img src={image.src} alt="" className="pdp-gallery__thumb-photo" />
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

      <div className={`pdp-gallery__stage${zoomActive && canZoom ? " pdp-gallery__stage--zooming" : ""}`}>
        <div
          ref={mainRef}
          className={`pdp-gallery__main${zoomActive && canZoom ? " pdp-gallery__main--zooming" : ""}`}
          onMouseEnter={() => canZoom && setZoomActive(true)}
          onMouseLeave={() => setZoomActive(false)}
          onMouseMove={onMouseMove}
          onTouchStart={(e) => {
            setTouchStartX(e.touches[0]?.clientX ?? null);
            if (canZoom) setZoomActive(true);
          }}
          onTouchMove={onTouchMove}
          onTouchEnd={(e) => {
            setZoomActive(false);
            if (touchStartX == null || images.length <= 1) return;
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
          onTouchCancel={() => {
            setZoomActive(false);
            setTouchStartX(null);
          }}
          onClick={openLightbox}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && openLightbox()}
          aria-label={canZoom ? "Hover to zoom product image" : "Product image"}
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
            {showVideo && videos[0] ? (
              <div className="pdp-video-embed pdp-video-embed--gallery">
                <iframe
                  src={videos[0].embedUrl}
                  title={videos[0].title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : activeImage.src ? (
              <img
                ref={photoRef}
                src={activeImage.src}
                alt={activeImage.alt}
                className="pdp-gallery__photo"
                draggable={false}
                onLoad={(event) => {
                  const image = event.currentTarget;
                  setImageMetrics({
                    naturalWidth: image.naturalWidth,
                    naturalHeight: image.naturalHeight,
                  });
                  measureImageRect();
                }}
              />
            ) : (
              <div
                className="pdp-gallery__swatch"
                style={{ backgroundColor: activeImage.color }}
                role="img"
                aria-label={activeImage.alt}
              />
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

        {zoomActive && canZoom && mainSize.width > 0 ? (
          <div ref={paneRef} className="pdp-gallery__zoom-pane" aria-hidden>
            <img
              src={activeImage.src}
              alt=""
              className="pdp-gallery__zoom-image"
              draggable={false}
              style={{
                width: imageRect.width * zoomScale.x,
                height: imageRect.height * zoomScale.y,
                transform: `translate(${-(lensPos.x - imageRect.left) * zoomScale.x}px, ${-(lensPos.y - imageRect.top) * zoomScale.y}px)`,
              }}
            />
          </div>
        ) : null}
      </div>

      {videos.length > 0 ? (
        <button
          type="button"
          className="pdp-gallery__video-btn"
          onClick={() => setShowVideo(true)}
        >
          <Play size={16} />
          Watch Product Video
        </button>
      ) : null}

      {lightboxOpen ? (
        <div
          className="pdp-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            className="pdp-lightbox__close"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close lightbox"
          >
            ×
          </button>
          <div
            className="pdp-lightbox__swatch"
            onClick={(e) => e.stopPropagation()}
            role="img"
            aria-label={activeImage.alt}
          >
            {activeImage.src ? (
              <img
                src={activeImage.src}
                alt={activeImage.alt}
                className="pdp-lightbox__photo"
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
        </div>
      ) : null}
    </div>
  );
}
