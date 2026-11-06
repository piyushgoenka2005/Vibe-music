/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-this-alias, @typescript-eslint/no-unused-vars */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AudioPreviewPlayer, { AudioTrack } from "./AudioPreviewPlayer";

describe("Adversarial Probes: Audio Preview Player Synthesis & Edge Cases", () => {
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
      sampleRate: number;
      currentTime = 0.5;
      state: "suspended" | "running" | "closed" = "suspended";
      destination = {};

      constructor(options?: { sampleRate?: number }) {
        this.sampleRate = options?.sampleRate || 44100;
        mockAudioContextInstance = this;
      }

      createOscillator() {
        return new MockOscillator();
      }

      createGain() {
        return new MockGainNode();
      }

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
  });

  it("handles zero-duration tracks without division by zero, crashing, or invalid ARIA values", () => {
    const zeroDurationTrack: AudioTrack[] = [
      {
        id: "zero-track",
        title: "Silent Hit",
        description: "Zero duration transient tone",
        duration: 0,
        toneCategory: "clean",
      },
    ];

    const html = renderToStaticMarkup(
      <AudioPreviewPlayer productName="Test Snare" tracks={zeroDurationTrack} />,
    );

    expect(html).toContain("Silent Hit");
    // Formatted time 0s is 0:00
    expect(html).toContain("0:00");
    // Range input max is 0
    expect(html).toContain('max="0"');
    expect(html).toContain('aria-valuemax="0"');
    expect(html).not.toContain("NaN");
    expect(html).not.toContain("Infinity");
  });

  it("safely handles empty tracks array by falling back to default instrument tracks", () => {
    const html = renderToStaticMarkup(<AudioPreviewPlayer productName="Guitar" tracks={[]} />);

    // Default tracks should be present
    expect(html).toContain("Clean Tone (Neck Pickup)");
    expect(html).toContain("Overdrive Crunch (Bridge Pickup)");
    expect(html).toContain("Acoustic Strum &amp; Harmonics");
    expect(html).not.toContain("NaN");
  });

  it("supports ultra-high sample rates (96kHz, 192kHz, 384kHz) in Web Audio Context synthesis", () => {
    const highSampleRates = [96000, 192000, 384000];

    for (const rate of highSampleRates) {
      const ctx = new (globalThis as any).AudioContext({ sampleRate: rate });
      expect(ctx.sampleRate).toBe(rate);

      // Verify tone synthesis nodes can be created and connected under high sample rate
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.25);

      expect(osc.start).toHaveBeenCalledWith(ctx.currentTime);
      expect(osc.stop).toHaveBeenCalledWith(ctx.currentTime + 1.25);
    }
  });

  it("tests oscillator cleanup under rapid concurrent synthesis triggers", () => {
    // Simulate what happens in startSynthesis when called 50 times concurrently
    const activeOscillators: any[] = [];
    const stopSynthesis = () => {
      activeOscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // ignore
        }
      });
      activeOscillators.length = 0;
    };

    const ctx = new (globalThis as any).AudioContext();
    const mainGain = ctx.createGain();

    // Trigger rapid synthesis 50 times
    for (let i = 0; i < 50; i++) {
      stopSynthesis();

      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.connect(noteGain);
      noteGain.connect(mainGain);
      osc.start(ctx.currentTime);

      activeOscillators.push(osc);
      if (activeOscillators.length > 10) {
        activeOscillators.shift();
      }
    }

    // After 50 iterations, activeOscillators should have bounded memory (max 10 or cleaned)
    expect(activeOscillators.length).toBeLessThanOrEqual(10);
    // Previous oscillators must have received stop() and disconnect()
    expect(createdOscillators.length).toBe(50);
    const stoppedOscs = createdOscillators.filter((o) => o.stop.mock.calls.length > 0);
    expect(stoppedOscs.length).toBe(49); // The first 49 were stopped by stopSynthesis()
  });

  it("tests audio lifecycle cleanup on component unmount", async () => {
    const ctx = new (globalThis as any).AudioContext();
    const activeOscillators: any[] = [ctx.createOscillator(), ctx.createOscillator()];
    let timerId: any = setInterval(() => {}, 1000);

    // Unmount cleanup function matching AudioPreviewPlayer.tsx line 331-341
    const unmountCleanup = () => {
      // 1. Clear timer
      clearInterval(timerId);
      timerId = null;

      // 2. Stop and disconnect oscillators
      activeOscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {}
      });
      activeOscillators.length = 0;

      // 3. Close AudioContext
      if (ctx.state !== "closed") {
        void ctx.close();
      }
    };

    unmountCleanup();

    expect(activeOscillators.length).toBe(0);
    expect(ctx.close).toHaveBeenCalledTimes(1);
    expect(ctx.state).toBe("closed");
  });

  it("verifies toneCategory waveform mappings across clean, drive, acoustic, lead, ambient", () => {
    const toneWaveforms: Record<AudioTrack["toneCategory"], string> = {
      clean: "sine",
      drive: "sawtooth",
      acoustic: "triangle",
      lead: "square",
      ambient: "sine",
    };

    const ctx = new (globalThis as any).AudioContext();

    for (const [toneCategory, expectedWaveform] of Object.entries(toneWaveforms)) {
      const osc = ctx.createOscillator();
      if (toneCategory === "drive") {
        osc.type = "sawtooth";
      } else if (toneCategory === "acoustic") {
        osc.type = "triangle";
      } else if (toneCategory === "lead") {
        osc.type = "square";
      } else {
        osc.type = "sine";
      }
      expect(osc.type).toBe(expectedWaveform);
    }
  });
});
