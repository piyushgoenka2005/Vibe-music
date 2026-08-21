/**
 * Storefront image helpers — re-exports the production media pipeline.
 * Prefer importing from `@/lib/storefrontImages` for new code.
 */
export {
  cdnMasterUrl,
  cdnThumbUrl,
  optimizeImageUrl,
  storefrontImageCandidates,
  storefrontImageUrl,
  storefrontZoomImageUrl,
} from "@/lib/storefrontImages";
