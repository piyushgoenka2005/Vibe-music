"use client";

import { useCallback, useState } from "react";
import { Play } from "lucide-react";
import type { ProductImage, ProductVideo } from "@/types/product";

interface ProductGalleryProps {
  images: ProductImage[];
  videos: ProductVideo[];
  productName: string;
}

export default function ProductGallery({
  images,
  videos,
  productName,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [showVideo, setShowVideo] = useState(false);

  const activeImage = images[activeIndex] ?? images[0];

  const onTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const touch = e.touches[0];
      if (!touch) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((touch.clientX - rect.left) / rect.width) * 100;
      const y = ((touch.clientY - rect.top) / rect.height) * 100;
      setZoomPos({ x, y });
      const inner = e.currentTarget.querySelector<HTMLElement>(
        ".pdp-gallery__main-inner"
      );
      if (inner) {
        inner.style.transform = "scale(1.8)";
        inner.style.transformOrigin = `${x}% ${y}%`;
      }
    },
    []
  );

  const onTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const inner = e.currentTarget.querySelector<HTMLElement>(
      ".pdp-gallery__main-inner"
    );
    if (inner) {
      inner.style.transform = "scale(1)";
      inner.style.transformOrigin = "center center";
    }
  }, []);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setZoomPos({ x, y });
      e.currentTarget.querySelector<HTMLElement>(
        ".pdp-gallery__main-inner"
      )!.style.transform = `scale(1.8)`;
      e.currentTarget.querySelector<HTMLElement>(
        ".pdp-gallery__main-inner"
      )!.style.transformOrigin = `${x}% ${y}%`;
    },
    []
  );

  const onMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const inner = e.currentTarget.querySelector<HTMLElement>(
      ".pdp-gallery__main-inner"
    );
    if (inner) {
      inner.style.transform = "scale(1)";
      inner.style.transformOrigin = "center center";
    }
  }, []);

  return (
    <div className="pdp-gallery" aria-label={`${productName} image gallery`}>
      <div
        className="pdp-gallery__main"
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onClick={() => setLightboxOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setLightboxOpen(true)}
        aria-label="Open image lightbox"
      >
        <div className="pdp-gallery__main-inner">
          {showVideo && videos[0] ? (
            <div className="pdp-video-embed" style={{ width: "100%", height: "100%" }}>
              <iframe
                src={videos[0].embedUrl}
                title={videos[0].title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : activeImage.src ? (
            <img
              src={activeImage.src}
              alt={activeImage.alt}
              className="pdp-gallery__photo"
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
        <div
          className="pdp-gallery__zoom-lens"
          style={{
            left: `calc(${zoomPos.x}% - 60px)`,
            top: `calc(${zoomPos.y}% - 60px)`,
          }}
        />
      </div>

      <div className="pdp-gallery__thumbs" role="list" aria-label="Product thumbnails">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            role="listitem"
            className={`pdp-gallery__thumb${index === activeIndex && !showVideo ? " pdp-gallery__thumb--active" : ""}`}
            onClick={() => {
              setShowVideo(false);
              setActiveIndex(index);
            }}
            aria-label={image.alt}
            aria-current={index === activeIndex && !showVideo}
          >
            {image.src ? (
              <img
                src={image.src}
                alt=""
                className="pdp-gallery__thumb-photo"
              />
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
              className="pdp-gallery__thumb-swatch"
              style={{
                backgroundColor: video.thumbnailColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Play size={20} color="#fff" fill="#fff" />
            </div>
          </button>
        ))}
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
              <div style={{ width: "100%", height: "100%", backgroundColor: activeImage.color }} />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
