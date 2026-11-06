import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AudioPreviewPlayer from "./AudioPreviewPlayer";

describe("AudioPreviewPlayer", () => {
  it("renders audio player with region role and heading", () => {
    const html = renderToStaticMarkup(
      <AudioPreviewPlayer productName="Fender Stratocaster" category="Electric Guitars" />,
    );
    expect(html).toContain('role="region"');
    expect(html).toContain("Audio &amp; Tone Previews");
    expect(html).toContain("Fender Stratocaster");
    expect(html).toContain("Electric Guitars");
  });

  it("renders sample instrument tone tracks: Clean Tone, Overdrive Crunch, Acoustic Strum", () => {
    const html = renderToStaticMarkup(<AudioPreviewPlayer />);
    expect(html).toContain("Clean Tone (Neck Pickup)");
    expect(html).toContain("Overdrive Crunch (Bridge Pickup)");
    expect(html).toContain("Acoustic Strum &amp; Harmonics");
    expect(html).toContain("Lead Solo (High Gain)");
    expect(html).toContain("Ambient Reverb &amp; Shimmer");
  });

  it("renders interactive scrub timeline slider with range input and accessible ARIA attributes", () => {
    const html = renderToStaticMarkup(<AudioPreviewPlayer />);
    expect(html).toContain('type="range"');
    expect(html).toContain("vibe-audio-player__scrub-input");
    expect(html).toContain('aria-label="Audio timeline scrub bar"');
  });

  it("renders playback transport controls including play/pause and volume slider", () => {
    const html = renderToStaticMarkup(<AudioPreviewPlayer />);
    expect(html).toContain("vibe-audio-player__play-btn");
    expect(html).toContain("vibe-audio-player__volume-input");
    expect(html).toContain("vibe-audio-player__bars");
  });

  it("accepts custom audio tracks", () => {
    const customTracks = [
      {
        id: "custom-tone-1",
        title: "Vintage Tweed 59",
        description: "Warm tweed saturation with dynamic sensitivity",
        duration: 45,
        toneCategory: "drive" as const,
      },
    ];
    const html = renderToStaticMarkup(
      <AudioPreviewPlayer productName="Custom Amp" tracks={customTracks} />,
    );
    expect(html).toContain("Vintage Tweed 59");
    expect(html).toContain("0:45");
  });
});
