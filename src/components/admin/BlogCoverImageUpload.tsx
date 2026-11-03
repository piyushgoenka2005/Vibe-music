"use client";

import BannerImageUpload from "@/components/admin/BannerImageUpload";
import { IMAGE_SPECS } from "@/lib/admin/imageSpecs";

interface BlogCoverImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export default function BlogCoverImageUpload({
  value,
  onChange,
  disabled = false,
}: BlogCoverImageUploadProps) {
  return (
    <BannerImageUpload
      label="Cover image"
      spec={IMAGE_SPECS.blogCover}
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
