"use client";

import Image from "next/image";
import { useState } from "react";
import { buildMediaTransformUrl, MEDIA_PRESETS } from "@/lib/media-url";

interface ReviewCardImagesProps {
  images: string[];
  title: string;
}

export default function ReviewCardImages({ images, title }: ReviewCardImagesProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <div className="pdp-review-images">
        {images.map((url, index) => (
          <button
            key={`${url}-${index}`}
            type="button"
            className="pdp-review-images__thumb"
            onClick={() => setActiveIndex(index)}
            aria-label={`View review image ${index + 1}`}
          >
            <Image
              src={buildMediaTransformUrl(url, MEDIA_PRESETS.reviewThumbnail)}
              alt={`${title} review image ${index + 1}`}
              width={72}
              height={72}
            />
          </button>
        ))}
      </div>

      {activeIndex !== null ? (
        <div
          className="pdp-review-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Review image preview"
          onClick={() => setActiveIndex(null)}
        >
          <div
            className="pdp-review-lightbox__inner"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="pdp-review-lightbox__close"
              onClick={() => setActiveIndex(null)}
              aria-label="Close image preview"
            >
              ×
            </button>
            <Image
              src={buildMediaTransformUrl(
                images[activeIndex]!,
                MEDIA_PRESETS.reviewGallery
              )}
              alt={`${title} review image`}
              width={600}
              height={600}
              className="pdp-review-lightbox__image"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
