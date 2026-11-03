"use client";

import Image from "next/image";
import { useState } from "react";
import { GearReelItem } from "@/types/homepage";

interface HomepageGearReelsSectionProps {
  reels: GearReelItem[];
}

export default function HomepageGearReelsSection({ reels }: HomepageGearReelsSectionProps) {
  const [selectedReel, setSelectedReel] = useState<GearReelItem | null>(null);

  if (!reels || reels.length === 0) {
    return null;
  }

  return (
    <>
      {/* Reels Grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {reels.map((reel) => (
          <button
            key={reel.id}
            onClick={() => setSelectedReel(reel)}
            className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 transition-transform hover:scale-105"
          >
            {/* Poster Image */}
            {reel.posterUrl && (
              <Image src={reel.posterUrl} alt={reel.title} fill className="object-cover" />
            )}

            {/* Badge Label */}
            {reel.badgeLabel && (
              <div className="absolute top-2 right-2 rounded-full bg-red-600 px-2 py-1 text-xs font-semibold text-white">
                {reel.badgeLabel}
              </div>
            )}

            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 opacity-0 transition-opacity group-hover:opacity-100">
                <svg className="h-6 w-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>
            </div>

            {/* Title Overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent px-3 py-2">
              <p className="line-clamp-2 text-xs font-semibold text-white">{reel.title}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Video Modal */}
      {selectedReel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedReel(null)}
        >
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-lg bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedReel(null)}
              className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Video Player */}
            <div className="aspect-video">
              <video
                src={selectedReel.videoUrl}
                autoPlay
                controls
                className="h-full w-full object-contain"
              />
            </div>

            {/* Reel Details */}
            <div className="bg-gray-900 p-4">
              <h3 className="text-lg font-semibold text-white">{selectedReel.title}</h3>
              {selectedReel.description && (
                <p className="mt-2 text-sm text-gray-300">{selectedReel.description}</p>
              )}

              {/* Action Buttons */}
              <div className="mt-4 flex flex-wrap gap-3">
                {/* Instagram Link */}
                {selectedReel.instagramLink && (
                  <a
                    href={selectedReel.instagramLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.117.6c-.653.25-1.209.606-1.738 1.135-.529.529-.886 1.084-1.135 1.738-.267.788-.468 1.658-.528 2.936C.014 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.528 2.936.25.653.606 1.209 1.135 1.738.529.529 1.084.886 1.738 1.135.788.267 1.658.468 2.936.528 1.28.058 1.687.072 4.947.072s3.668-.014 4.947-.072c1.277-.06 2.148-.261 2.936-.528.653-.25 1.209-.606 1.738-1.135.529-.529.886-1.084 1.135-1.738.267-.788.468-1.658.528-2.936.058-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.261-2.148-.528-2.936-.25-.653-.606-1.209-1.135-1.738-.529-.529-1.084-.886-1.738-1.135-.788-.267-1.658-.468-2.936-.528C15.667.014 15.26 0 12 0zm0 2.16c3.203 0 3.585.009 4.849.070 1.171.054 1.805.244 2.227.408.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.354 1.057.408 2.227.061 1.264.07 1.646.07 4.849s-.009 3.585-.07 4.849c-.054 1.171-.244 1.805-.408 2.227-.217.562-.477.96-.896 1.382-.42.419-.819.679-1.381.896-.422.164-1.057.354-2.227.408-1.264.061-1.646.07-4.849.07s-3.585-.009-4.849-.07c-1.171-.054-1.805-.244-2.227-.408-.562-.217-.96-.477-1.382-.896-.419-.42-.679-.819-.896-1.381-.164-.422-.354-1.057-.408-2.227-.061-1.264-.07-1.646-.07-4.849s.009-3.585.07-4.849c.054-1.171.244-1.805.408-2.227.217-.562.477-.96.896-1.382.42-.419.819-.679 1.381-.896.422-.164 1.057-.354 2.227-.408 1.264-.061 1.646-.07 4.849-.07z" />
                    </svg>
                    View on Instagram
                  </a>
                )}

                {/* Product Link */}
                {selectedReel.productId && (
                  <a
                    href={`/product/${selectedReel.productId}`}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    Shop Product
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
