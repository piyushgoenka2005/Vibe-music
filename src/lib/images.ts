/**
 * Storefront image helpers — re-exports the production media pipeline.
 * Prefer importing from `@/lib/storefrontImages` for new code.
 */
export {
  cdnDerivativeUrl,
  cdnMasterUrl,
  cdnThumbUrl,
  optimizeImage,
  optimizeImageUrl,
  storefrontImageCandidates,
  storefrontImageUrl,
  storefrontZoomImageUrl,
  unwrapStorefrontSrc,
} from "@/lib/storefrontImages";
