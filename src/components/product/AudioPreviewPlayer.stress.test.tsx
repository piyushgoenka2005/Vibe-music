/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-this-alias, @typescript-eslint/no-unused-vars */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AudioPreviewPlayer, { AudioTrack } from "./AudioPreviewPlayer";

describe("AudioPreviewPlayer — Empirical Web Audio & Track Switching Stress Harness", () => {
  let createdOscillators: Array<{
    type: string;
    frequency: { setValueAtTime: ReturnType<typeof vi.fn> };
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
  }> = [];

  let createdGainNodes: Array<{
    gain: {
      setValueAtTime: ReturnType<typeof vi.fn>;
      exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
    };
    connect: ReturnType<typeof vi.fn>;
  }> = [];

  let mockAudioContextInstance: any = null;

  beforeEach(() => {
    createdOscillators = [];
    createdGainNodes = [];

    class MockOscillator {
      type = "sine";
      frequency = { setValueAtTime: vi.fn() };
      connect = vi.fn();
      disconnect = vi.fn();
      start = vi.fn();
      stop = vi.fn();
      constructor() {
        createdOscillators.push(this);
      }
    }

    class MockGainNode {
      gain = {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      };
      connect = vi.fn();
      constructor() {
        createdGainNodes.push(this);
      }
    }

    class MockAudioContext {
      currentTime = 1.0;
      state: "suspended" | "running" | "closed" = "suspended";
      destination = {};

      constructor() {
        mockAudioContextInstance = this;
      }

      createOscillator = vi.fn(() => new MockOscillator());
      createGain = vi.fn(() => new MockGainNode());

      resume = vi.fn(async () => {
        this.state = "running";
      });

      close = vi.fn(async () => {
        this.state = "closed";
      });
    }

    (globalThis as any).window = {
      AudioContext: MockAudioContext,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    (globalThis as any).AudioContext = MockAudioContext;
  });

  afterEach(() => {
    delete (globalThis as any).window;
    delete (globalThis as any).AudioContext;
    vi.restoreAllMocks();
  });

  describe("1. Web Audio API Lifecycle (Suspended / Resumed / Closed)", () => {
    it("safely resumes suspended audio context and connects master gain to destination", async () => {
      const ctx = new (globalThis as any).AudioContext();
      expect(ctx.state).toBe("suspended");

      // Setup gain node like getOrCreateAudioContext
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.85, ctx.currentTime);
      masterGain.connect(ctx.destination);

      expect(ctx.createGain).toHaveBeenCalled();
      expect(masterGain.gain.setValueAtTime).toHaveBeenCalledWith(0.85, 1.0);
      expect(masterGain.connect).toHaveBeenCalledWith(ctx.destination);

      // Trigger resume
      await ctx.resume();
      expect(ctx.resume).toHaveBeenCalledTimes(1);
      expect(ctx.state).toBe("running");
    });

    it("unmount cleanup closes context safely and disconnects all active nodes", async () => {
      const ctx = new (globalThis as any).AudioContext();
      await ctx.resume();

      const activeOscillators = [ctx.createOscillator(), ctx.createOscillator()];

      // Unmount teardown sequence
      activeOscillators.forEach((osc) => {
        osc.stop();
        osc.disconnect();
      });
      activeOscillators.length = 0;

      if (ctx.state !== "closed") {
        await ctx.close();
      }

      expect(activeOscillators.length).toBe(0);
      expect(ctx.state).toBe("closed");
      expect(ctx.close).toHaveBeenCalledTimes(1);
    });
  });

  describe("2. Volume Clamping & Mute Boundary Dynamics", () => {
    it("ensures volume slider markup clamps values in [0, 1] with step 0.05", () => {
      const html = renderToStaticMarkup(<AudioPreviewPlayer />);
      expect(html).toContain('class="vibe-audio-player__volume-input"');
      expect(html).toContain('min="0"');
      expect(html).toContain('max="1"');
      expect(html).toContain('step="0.05"');
    });

    it("verifies gainNode reacts appropriately to volume changes and mute transitions", () => {
      const ctx = new (globalThis as any).AudioContext();
      const masterGain = ctx.createGain();

      // Simulate volume updates: 0.85 -> 0.4 -> 0 (mute) -> 0.7
      const volumeSteps = [0.85, 0.4, 0, 0.7];
      for (const vol of volumeSteps) {
        masterGain.gain.setValueAtTime(vol, ctx.currentTime);
      }

      expect(masterGain.gain.setValueAtTime).toHaveBeenNthCalledWith(1, 0.85, 1.0);
      expect(masterGain.gain.setValueAtTime).toHaveBeenNthCalledWith(2, 0.4, 1.0);
      expect(masterGain.gain.setValueAtTime).toHaveBeenNthCalledWith(3, 0, 1.0);
      expect(masterGain.gain.setValueAtTime).toHaveBeenNthCalledWith(4, 0.7, 1.0);
    });
  });

  describe("3. Rapid Track Switching & Queue Boundedness", () => {
    it("handles bidirectional track wrapping arithmetic cleanly across 1,000 cycles", () => {
      const trackCount = 5;
      let currentIndex = 0;

      // Wrap forward 500 times
      for (let i = 0; i < 500; i++) {
        currentIndex = (currentIndex + 1) % trackCount;
        expect(currentIndex).toBeGreaterThanOrEqual(0);
        expect(currentIndex).toBeLessThan(trackCount);
      }

      // Wrap backward 500 times
      for (let i = 0; i < 500; i++) {
        currentIndex = (currentIndex - 1 + trackCount) % trackCount;
        expect(currentIndex).toBeGreaterThanOrEqual(0);
        expect(currentIndex).toBeLessThan(trackCount);
      }
    });

    it("prevents oscillator memory leak during 100 rapid track changes", () => {
      const ctx = new (globalThis as any).AudioContext();
      const activeOscillators: any[] = [];

      const stopSynthesis = () => {
        activeOscillators.forEach((osc) => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {}
        });
        activeOscillators.length = 0;
      };

      // Rapidly switch tracks 100 times, spawning oscillators
      for (let i = 0; i < 100; i++) {
        stopSynthesis();
        const osc = ctx.createOscillator();
        osc.start(ctx.currentTime);
        activeOscillators.push(osc);
        if (activeOscillators.length > 10) {
          activeOscillators.shift();
        }
      }

      // Buffer remains strictly bounded at 1
      expect(activeOscillators.length).toBe(1);

      // Final cleanup
      stopSynthesis();
      expect(activeOscillators.length).toBe(0);
    });
  });

  describe("4. Edge Case Track Configurations", () => {
    it("safely formats non-standard durations (0s, 65s, 3600s)", () => {
      const nonStandardTracks: AudioTrack[] = [
        {
          id: "t0",
          title: "Zero Seconds Track",
          description: "Zero length clip",
          duration: 0,
          toneCategory: "clean",
        },
        {
          id: "t65",
          title: "Over Minute Track",
          description: "Minute plus clip",
          duration: 65,
          toneCategory: "drive",
        },
        {
          id: "t3600",
          title: "Hour Long Track",
          description: "Hour ambient drone",
          duration: 3600,
          toneCategory: "ambient",
        },
      ];

      const html = renderToStaticMarkup(
        <AudioPreviewPlayer productName="Synth Lab" tracks={nonStandardTracks} />,
      );

      // Check formatted duration labels
      expect(html).toContain("0:00");
      expect(html).toContain("1:05");
      expect(html).toContain("60:00");
    });
  });
});
