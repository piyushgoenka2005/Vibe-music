import { describe, it, expect } from "vitest";
import { sampleProducts, sampleVariants } from "../fixtures/catalog-fixtures";
describe("Tier 1: PDP Media Gallery, Variants Matrix & Audio Preview", () => {
  it("resolves primary gallery image and thumbnail strip", () => {
    const product = sampleProducts[0];
    const defaultVariant = sampleVariants.strat[0];

    const primaryImage = defaultVariant.images[0] ?? product.image;
    expect(primaryImage).toBe("/images/products/strat-sunburst.jpg");

    // Thumbnail strip includes both product and variant images
    const thumbnailCandidates = [
      product.image,
      ...defaultVariant.images,
      "/images/products/strat-back.jpg",
      "/images/products/strat-headstock.jpg",
    ];
    const uniqueThumbnails = Array.from(new Set(thumbnailCandidates));
    expect(uniqueThumbnails.length).toBe(3);
    expect(uniqueThumbnails[0]).toBe("/images/products/strat-sunburst.jpg");
  });

  it("calculates 360-degree spin viewer frames accurately across rotational degrees", () => {
    const totalFrames = 36; // 36 frames = 10 degrees per frame
    const degreeStep = 360 / totalFrames;

    const getFrameForAngle = (degrees: number) => {
      const normalized = ((degrees % 360) + 360) % 360;
      return Math.floor(normalized / degreeStep) % totalFrames;
    };

    expect(getFrameForAngle(0)).toBe(0);
    expect(getFrameForAngle(10)).toBe(1);
    expect(getFrameForAngle(180)).toBe(18);
    expect(getFrameForAngle(350)).toBe(35);
    expect(getFrameForAngle(360)).toBe(0); // Full rotation wraps around
    expect(getFrameForAngle(-10)).toBe(35); // Negative rotation wraps backwards
  });

  it("parses video embeds from YouTube URLs accurately", () => {
    const embedUrls = [
      { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", expectedId: "dQw4w9WgXcQ" },
      { url: "https://youtu.be/dQw4w9WgXcQ", expectedId: "dQw4w9WgXcQ" },
      { url: "https://www.youtube.com/embed/dQw4w9WgXcQ", expectedId: "dQw4w9WgXcQ" },
    ];

    const extractYouTubeId = (url: string): string | null => {
      const match = url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/,
      );
      return match ? match[1] : null;
    };

    for (const test of embedUrls) {
      expect(extractYouTubeId(test.url)).toBe(test.expectedId);
    }
  });

  it("updates pricing, SKU, and availability when selecting product variants", () => {
    const _baseProduct = sampleProducts[0];
    const variants = sampleVariants.strat;

    // Default variant
    const defaultVar = variants.find((v) => v.isDefault)!;
    expect(defaultVar.sku).toBe("FEN-0144502500");
    expect(defaultVar.price).toBe(68500);
    expect(defaultVar.availability).toBe("in-stock");

    // Switch to premium Black variant
    const blackVar = variants.find((v) => v.label.includes("Black"))!;
    expect(blackVar.sku).toBe("FEN-0144503506");
    expect(blackVar.price).toBe(71000); // Higher price
    expect(blackVar.stock).toBe(5);
    expect(blackVar.availability).toBe("in-stock");

    // Switch to out-of-stock Tidepool variant
    const tidepoolVar = variants.find((v) => v.label.includes("Tidepool"))!;
    expect(tidepoolVar.stock).toBe(0);
    expect(tidepoolVar.availability).toBe("out-of-stock");
  });

  it("simulates PDP audio preview player controls and state transitions", () => {
    type AudioPlayerState = {
      isPlaying: boolean;
      currentTrack: string | null;
      volume: number; // 0.0 - 1.0
      currentTime: number;
      duration: number;
    };

    const playerState: AudioPlayerState = {
      isPlaying: false,
      currentTrack: null,
      volume: 0.8,
      currentTime: 0,
      duration: 30, // 30-second sound bite
    };

    // Play action
    const playTrack = (trackUrl: string) => {
      playerState.isPlaying = true;
      playerState.currentTrack = trackUrl;
      playerState.currentTime = 0;
    };

    // Pause action
    const pauseTrack = () => {
      playerState.isPlaying = false;
    };

    // Volume adjustment
    const setVolume = (vol: number) => {
      playerState.volume = Math.max(0, Math.min(1, vol));
    };

    // Test sequence
    playTrack("/audio/previews/stratocaster-clean-tone.mp3");
    expect(playerState.isPlaying).toBe(true);
    expect(playerState.currentTrack).toBe("/audio/previews/stratocaster-clean-tone.mp3");

    pauseTrack();
    expect(playerState.isPlaying).toBe(false);

    setVolume(1.5); // Upper bound clamping
    expect(playerState.volume).toBe(1.0);

    setVolume(-0.5); // Lower bound clamping
    expect(playerState.volume).toBe(0.0);
  });
});
