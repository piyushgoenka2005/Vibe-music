"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MidlifeAudioEngine } from "@/gp9/lib/midlife-audio-engine";
import { MIDLIFE_VISUALISER_SHADES } from "@/gp9/lib/midlife-tokens";
import type { SoundLayerId } from "@/gp9/lib/midlife-sounds";
import { AMBIENT_ICONS, AmbientIcon, type AmbientIconId } from "@/gp9/components/midlife/ambient-icons";
import { MidlifeAwwwardsBadge } from "@/gp9/components/midlife/midlife-awwwards-badge";
import { MidlifeGrain } from "@/gp9/components/midlife/midlife-grain";
import { MidlifePixelDisplay } from "@/gp9/components/midlife/midlife-pixel-display";
import { MidlifePowerKnob } from "@/gp9/components/midlife/midlife-power-knob";
import { MidlifeSpeakerZone } from "@/gp9/components/midlife/midlife-speaker-zone";
import { RotaryKnob } from "@/gp9/components/midlife/rotary-knob";
import { cn } from "@/gp9/lib/utils";

const PORTRAIT_ROW_SHADES = ["#36383d", "#545659", "#6a6d73", "#9fa3a6", "#edeef1"] as const;
const PORTRAIT_ICON_COL: AmbientIconId[] = ["storm", "ocean", "ripple", "moon"];

const TRACK_LEFT = ["1", "2", "3"] as const;
const TRACK_RIGHT = ["4", "5", "6", "7", "8", "9", "0"] as const;
const TRACK_IDS = [...TRACK_LEFT, ...TRACK_RIGHT] as const;

const VIS_SHADES = [
  ...MIDLIFE_VISUALISER_SHADES,
  ...MIDLIFE_VISUALISER_SHADES,
].slice(0, 16);

type MidlifePanelProps = {
  className?: string;
};

export function MidlifePanel({ className }: MidlifePanelProps) {
  const engineRef = useRef<MidlifeAudioEngine | null>(null);

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = MidlifeAudioEngine.getInstance();
    }
    return engineRef.current;
  }, []);

  const [powered, setPowered] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState<"dormant" | "play" | "rec">("dormant");
  const [activeBeat, setActiveBeat] = useState<number | null>(null);
  const [activeBarBeat, setActiveBarBeat] = useState<number | null>(null);
  const [activeIcons, setActiveIcons] = useState<Set<AmbientIconId>>(new Set());
  const [activeTracks, setActiveTracks] = useState<Set<string>>(new Set());
  const [activeSteps, setActiveSteps] = useState<Set<number>>(new Set([12, 13, 14, 15]));
  const [playhead, setPlayhead] = useState(0);
  const [knobs, setKnobs] = useState({ volume: 0.62, filter: 0.48, reverb: 0.35, mod: 0.52 });

  const activeSoundIds = useMemo(() => {
    const ids = new Set<SoundLayerId>();
    AMBIENT_ICONS.forEach(({ id, sound }) => {
      if (activeIcons.has(id)) ids.add(sound);
    });
    return ids;
  }, [activeIcons]);

  const powerOn = useCallback(async () => {
    await getEngine().ensureStarted();
    setPowered(true);
  }, [getEngine]);

  const boot = useCallback(async () => {
    await powerOn();
  }, [powerOn]);

  useEffect(() => {
    if (!powered) return;
    const engine = getEngine();
    engine.setMasterVolume(knobs.volume);
    engine.setFilterCutoff(knobs.filter);
    engine.setReverbMix(knobs.reverb);
    engine.setModulation(knobs.mod);
  }, [getEngine, knobs, powered]);

  useEffect(() => {
    if (!powered) return;
    const engine = getEngine();
    const allSounds: SoundLayerId[] = [
      "bird", "owl", "forest", "rain", "plane", "steps", "static", "wind",
      "machine", "flame", "water", "city", "night", "leaf",
    ];
    allSounds.forEach((sound) => {
      engine.toggleSound(sound, activeSoundIds.has(sound));
    });

    if (recording) setStatus("rec");
    else if (activeSoundIds.size > 0 || engine.isTransportRunning()) setStatus("play");
    else setStatus("dormant");
  }, [activeSoundIds, getEngine, powered, recording]);

  useEffect(() => {
    if (!powered || status !== "play") return;
    const id = window.setInterval(() => {
      setPlayhead((p) => (p + 1) % 16);
    }, 280);
    return () => window.clearInterval(id);
  }, [powered, status]);

  const displayStatus =
    status === "rec" ? "RECORDING" : status === "play" ? "ACTIVE" : "DORMANT";

  const toggleIcon = async (iconId: AmbientIconId) => {
    await boot();
    setActiveIcons((prev) => {
      const next = new Set(prev);
      if (next.has(iconId)) next.delete(iconId);
      else next.add(iconId);
      return next;
    });
    if (autoPlay && !getEngine().isTransportRunning() && activeBeat === null) {
      void selectBeat(0);
    }
  };

  const selectBeat = async (index: number) => {
    await boot();
    setActiveBeat(index);
    getEngine().setBarLength(1);
    getEngine().setBeatPattern(index);
    setStatus(recording ? "rec" : "play");
  };

  const selectBarBeat = async (index: number) => {
    await boot();
    setActiveBarBeat(index);
    if (autoPlay) {
      getEngine().setBarLength(1);
      getEngine().setBeatPattern(index % 4);
      setStatus(recording ? "rec" : "play");
    }
  };

  const toggleTrack = async (track: string) => {
    await boot();
    setActiveTracks((prev) => {
      const next = new Set(prev);
      if (next.has(track)) next.delete(track);
      else next.add(track);
      return next;
    });
    const layerIndex = TRACK_IDS.indexOf(track as (typeof TRACK_IDS)[number]);
    if (layerIndex >= 0 && layerIndex < AMBIENT_ICONS.length) {
      const { id } = AMBIENT_ICONS[layerIndex];
      setActiveIcons((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  };

  const toggleStep = async (index: number) => {
    await boot();
    setActiveSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleRecord = async () => {
    await boot();
    if (recording) {
      getEngine().stopRecording();
      setRecording(false);
      setStatus(getEngine().isTransportRunning() || activeSoundIds.size > 0 ? "play" : "dormant");
      return;
    }
    setRecording(true);
    setStatus("rec");
    getEngine().startRecording((url) => {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "midlife-session.webm";
      anchor.click();
      URL.revokeObjectURL(url);
    });
  };

  const bottomControls = (
    <div className="midlife-row-bottom">
      <button
        type="button"
        className={cn("midlife-framer-toggle", autoPlay && "midlife-framer-toggle--on")}
        onClick={async () => {
          await boot();
          setAutoPlay((v) => !v);
        }}
        aria-pressed={autoPlay}
      >
        <MidlifeGrain />
        <span className="midlife-framer-toggle-knob" aria-hidden />
        <span className="midlife-framer-toggle-label">AUTOPLAY</span>
      </button>

      <button
        type="button"
        className={cn("midlife-record-zone", recording && "midlife-record-zone--active")}
        onClick={() => void toggleRecord()}
        aria-pressed={recording}
      >
        <MidlifeGrain />
        <span className="midlife-record-disc" aria-hidden />
        RECORD SESSION
      </button>
    </div>
  );

  return (
    <div data-lenis-prevent className={cn("midlife-chassis", className)}>
      <div className="midlife-zones midlife-zones--portrait">
        <div className="midlife-portrait-top">
          <div className="midlife-zone midlife-portrait-power">
            <MidlifeGrain />
            <MidlifePowerKnob
              active={powered}
              onClick={() => {
                void powerOn();
              }}
            />
          </div>

          <div className="midlife-zone midlife-display-zone">
            <MidlifeGrain />
            <MidlifePixelDisplay status={displayStatus} powered={powered} />
          </div>

          <div className="midlife-zone midlife-portrait-speaker">
            <MidlifeGrain />
            <div className="midlife-speaker-grill-grid" aria-hidden>
              {Array.from({ length: 16 }).map((_, i) => (
                <span key={i} className="midlife-speaker-hole" />
              ))}
            </div>
            <div className="midlife-power-probe" aria-hidden />
          </div>
        </div>

        <div className="midlife-portrait-matrix-wrap">
          <span className="midlife-vertical-label midlife-vertical-label--beats">BEATS</span>
          <div className="midlife-zone midlife-portrait-matrix">
            <MidlifeGrain opacity={0.2} />
            {PORTRAIT_ROW_SHADES.map((shade, row) =>
              Array.from({ length: 4 }).map((_, col) => {
                const isBeatLabel = row === 0 && col < 4;
                const isIconCol = col === 3 && row > 0;
                const stepIndex = row * 3 + col;

                return (
                  <button
                    key={`portrait-${row}-${col}`}
                    type="button"
                    className={cn(
                      "midlife-matrix-cell",
                      row === 0 && activeBeat === col && "midlife-matrix-cell--lit",
                      col < 3 && row > 0 && activeSteps.has(stepIndex) && "midlife-matrix-cell--on",
                      isIconCol && activeIcons.has(PORTRAIT_ICON_COL[row - 1]) && "midlife-matrix-cell--on"
                    )}
                    style={{ backgroundColor: shade }}
                    onClick={() => {
                      if (isBeatLabel) void selectBeat(col);
                      else if (isIconCol) void toggleIcon(PORTRAIT_ICON_COL[row - 1]);
                      else if (col < 3 && row > 0) void toggleStep(stepIndex);
                    }}
                    aria-pressed={
                      isBeatLabel
                        ? activeBeat === col
                        : isIconCol
                          ? activeIcons.has(PORTRAIT_ICON_COL[row - 1])
                          : activeSteps.has(stepIndex)
                    }
                  >
                    {isBeatLabel ? (
                      <span className="midlife-matrix-label">{col + 1}</span>
                    ) : isIconCol ? (
                      row === 1 ? (
                        <svg viewBox="0 0 24 24" className="midlife-matrix-icon" aria-hidden>
                          <path
                            fill="currentColor"
                            d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                          />
                        </svg>
                      ) : (
                        <AmbientIcon id={PORTRAIT_ICON_COL[row - 1]} />
                      )
                    ) : (
                      <span className="midlife-matrix-dimple" aria-hidden />
                    )}
                  </button>
                );
              })
            )}
          </div>
          <MidlifeAwwwardsBadge className="midlife-portrait-award" />
        </div>

        {bottomControls}

        <div className="midlife-portrait-brand" aria-hidden>
          <span>midlife</span>
          <span>engineering</span>
        </div>
      </div>

      <div className="midlife-zones midlife-zones--landscape">
        <div className="midlife-row-top">
          <MidlifeSpeakerZone
            powered={powered}
            onPower={() => {
              void powerOn();
            }}
          />

          <div className="midlife-center-stack">
            <div className="midlife-zone midlife-display-zone">
              <MidlifeGrain />
              <MidlifePixelDisplay status={displayStatus} powered={powered} />
            </div>

            <div className="midlife-zone midlife-visualiser">
              <MidlifeGrain opacity={0.2} />
              {VIS_SHADES.map((shade, i) => (
                <button
                  key={`vis-${i}`}
                  type="button"
                  className={cn(
                    "midlife-vis-pad",
                    activeSteps.has(i) && "midlife-vis-pad--on",
                    playhead === i && status === "play" && "midlife-vis-pad--playhead"
                  )}
                  style={{ backgroundColor: shade }}
                  onClick={() => void toggleStep(i)}
                  aria-pressed={activeSteps.has(i)}
                  aria-label={`Visualiser step ${i + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="midlife-zone midlife-knobs-rail">
            <MidlifeGrain />
            <div className="midlife-knobs-row">
              <RotaryKnob
                index={0}
                value={knobs.volume}
                onChange={async (v) => {
                  await boot();
                  setKnobs((k) => ({ ...k, volume: v }));
                }}
              />
              <RotaryKnob
                index={1}
                value={knobs.filter}
                onChange={async (v) => {
                  await boot();
                  setKnobs((k) => ({ ...k, filter: v }));
                }}
              />
              <RotaryKnob
                index={2}
                value={knobs.reverb}
                onChange={async (v) => {
                  await boot();
                  setKnobs((k) => ({ ...k, reverb: v }));
                }}
              />
              <RotaryKnob
                index={3}
                value={knobs.mod}
                onChange={async (v) => {
                  await boot();
                  setKnobs((k) => ({ ...k, mod: v }));
                }}
              />
            </div>
          </div>

          <div className="midlife-rail-brand">
            <MidlifeAwwwardsBadge className="midlife-landscape-award" />
          </div>
        </div>

        <div className="midlife-row-mid">
          <div className="midlife-zone midlife-ph-zone">
            <MidlifeGrain />
            <span>Featured on</span>
            <span className="midlife-ph-logo">Product Hunt</span>
            <span className="midlife-ph-votes">▲ 449</span>
          </div>

          <div className="midlife-zone midlife-beats-row">
            <MidlifeGrain />
            <span className="midlife-vertical-label">Beats</span>
            {[0, 1, 2, 3].map((i) => (
              <button
                key={`beat-a-${i}`}
                type="button"
                className={cn("midlife-pad-btn", activeBeat === i && "midlife-pad-btn--lit")}
                onClick={() => void selectBeat(i)}
                aria-pressed={activeBeat === i}
              >
                {i + 1}
              </button>
            ))}
            <span className="midlife-vertical-label">Beats</span>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <button
                key={`beat-b-${i}`}
                type="button"
                className={cn("midlife-pad-btn", activeBarBeat === i && "midlife-pad-btn--on")}
                onClick={() => void selectBarBeat(i)}
                aria-pressed={activeBarBeat === i}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="midlife-zone midlife-beats-row">
          <MidlifeGrain />
          <span className="midlife-vertical-label">Tracks</span>
          {TRACK_LEFT.map((track) => (
            <button
              key={track}
              type="button"
              className={cn("midlife-pad-btn", activeTracks.has(track) && "midlife-pad-btn--on")}
              onClick={() => void toggleTrack(track)}
              aria-pressed={activeTracks.has(track)}
            >
              {track}
            </button>
          ))}
          {TRACK_RIGHT.map((track) => (
            <button
              key={track}
              type="button"
              className={cn("midlife-pad-btn", activeTracks.has(track) && "midlife-pad-btn--on")}
              onClick={() => void toggleTrack(track)}
              aria-pressed={activeTracks.has(track)}
            >
              {track}
            </button>
          ))}
        </div>

        <div className="midlife-zone midlife-icons-grid">
          <MidlifeGrain opacity={0.2} />
          {AMBIENT_ICONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={cn(
                "midlife-pad-btn midlife-pad-btn--icon",
                activeIcons.has(id) && "midlife-pad-btn--on"
              )}
              onClick={() => void toggleIcon(id)}
              aria-pressed={activeIcons.has(id)}
              aria-label={label}
              title={label}
            >
              <AmbientIcon id={id} />
            </button>
          ))}
        </div>

        {bottomControls}

        <div className="midlife-footer-brand">
          <span>midlife engineering</span>
          <span className="midlife-footer-dot" aria-hidden />
        </div>
      </div>
    </div>
  );
}
