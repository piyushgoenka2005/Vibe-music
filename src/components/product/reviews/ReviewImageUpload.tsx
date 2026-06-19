"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { uploadReviewImages } from "@/services/review.service";
import { buildCloudinaryTransformUrl, CLOUDINARY_PRESETS } from "@/lib/cloudinary-url";

interface ReviewImageUploadProps {
  productSlug: string;
  images: string[];
  onChange: (images: string[]) => void;
  disabled?: boolean;
}

const MAX_IMAGES = 5;

export default function ReviewImageUpload({
  productSlug,
  images,
  onChange,
  disabled = false,
}: ReviewImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      setError(`You can upload up to ${MAX_IMAGES} images.`);
      return;
    }

    const files = Array.from(fileList).slice(0, remaining);
    setError(null);
    setIsUploading(true);
    try {
      const urls = await uploadReviewImages(productSlug, files);
      onChange([...images, ...urls].slice(0, MAX_IMAGES));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeImage(index: number) {
    onChange(images.filter((_, imageIndex) => imageIndex !== index));
  }

  return (
    <div className="pdp-review-upload">
      <div className="pdp-review-upload__grid">
        {images.map((url, index) => (
          <div key={`${url}-${index}`} className="pdp-review-upload__preview">
            <Image
              src={buildCloudinaryTransformUrl(url, CLOUDINARY_PRESETS.reviewThumbnail)}
              alt={`Upload preview ${index + 1}`}
              width={72}
              height={72}
            />
            <button
              type="button"
              className="pdp-review-upload__remove"
              onClick={() => removeImage(index)}
              aria-label={`Remove image ${index + 1}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {images.length < MAX_IMAGES ? (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            disabled={disabled || isUploading}
            onChange={(event) => void handleFilesSelected(event.target.files)}
          />
          <button
            type="button"
            className="pdp-review-upload__button"
            disabled={disabled || isUploading}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? "Uploading…" : `Add photos (${images.length}/${MAX_IMAGES})`}
          </button>
        </>
      ) : null}

      {error ? <p className="pdp-review-upload__error">{error}</p> : null}
    </div>
  );
}
