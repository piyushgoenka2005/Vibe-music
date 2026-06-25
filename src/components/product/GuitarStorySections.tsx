"use client";

import AplusStoryBanners from "@/components/common/AplusStoryBanners";
import { GUITAR_STORY_BANNERS } from "@/data/guitarStorySections";

export default function GuitarStorySections() {
  return <AplusStoryBanners banners={GUITAR_STORY_BANNERS} />;
}
