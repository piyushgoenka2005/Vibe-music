"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Headphones,
  Pause,
  Play,
  Repeat,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import "./audio-preview-player.css";

export interface AudioTrack {
  id: string;
  title: string;
  description: string;
  duration: number; // in seconds
  toneCategory: "clean" | "drive" | "acoustic" | "lead" | "ambient";
  audioUrl?: string;
}

export interface AudioPreviewPlayerProps {
  productName?: string;
  category?: string;
  tracks?: AudioTrack[];
  className?: string;
}

const DEFAULT_TRACKS: AudioTrack[] = [
  {
    id: "clean-tone",
    title: "Clean Tone (Neck Pickup)",
    description: "Warm lows, crystalline highs, and rich fingerpicked harmonics.",
    duration: 28,
    toneCategory: "clean",
  },
  {
    id: "overdrive-tone",
    title: "Overdrive Crunch (Bridge Pickup)",
    description: "Dynamic vintage tube saturation with punchy mid-range bite.",
    duration: 34,
    toneCategory: "drive",
  },
  {
    id: "acoustic-strum",
    title: "Acoustic Strum & Harmonics",
    description: "Resonant spruce-body warmth with natural woody acoustic decay.",
    duration: 42,
    toneCategory: "acoustic",
  },
  {
    id: "lead-solo",
    title: "Lead Solo (High Gain)",
    description: "Sustaining modern lead tone with articulate note definition.",
    duration: 36,
    toneCategory: "lead",
  },
  {
    id: "ambient-reverb",
    title: "Ambient Reverb & Shimmer",
    description: "Spacious stereo modulation with lush atmospheric decay.",
    duration: 30,
    toneCategory: "ambient",
  },
];

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function AudioPreviewPlayer({
  productName = "Product",
  category = "Musical Gear",
  tracks = DEFAULT_TRACKS,
  className = "",
}: AudioPreviewPlayerProps) {
  const activeTracks = tracks.length > 0 ? tracks : DEFAULT_TRACKS;
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  const activeTrack = activeTracks[currentTrackIndex] || activeTracks[0];

  // Web Audio Context refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const activeOscillatorsRef = useRef<OscillatorNode[]>([]);
  const synthTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nativeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize or resume audio context safely on browser
  const getOrCreateAudioContext = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
        const gainNode = audioCtxRef.current.createGain();
        gainNode.gain.setValueAtTime(isMuted ? 0 : volume, audioCtxRef.current.currentTime);
        gainNode.connect(audioCtxRef.current.destination);
        gainNodeRef.current = gainNode;
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      void audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, [isMuted, volume]);

  // Stop synthetic audio playback
  const stopSynthesis = useCallback(() => {
    if (synthTimerRef.current) {
      clearInterval(synthTimerRef.current);
      synthTimerRef.current = null;
    }
    activeOscillatorsRef.current.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Ignore errors on already stopped oscillators
      }
    });
    activeOscillatorsRef.current = [];
  }, []);

  // Real tone synthesis generating musical chord notes based on toneCategory
  const startSynthesis = useCallback(
    (toneCategory: AudioTrack["toneCategory"]) => {
      const ctx = getOrCreateAudioContext();
      if (!ctx || !gainNodeRef.current) return;

      stopSynthesis();

      // Note frequencies (Hz) for musical progressions
      const noteScales: Record<AudioTrack["toneCategory"], number[]> = {
        clean: [220.0, 277.18, 329.63, 440.0, 554.37, 659.25], // A major warm clean
        drive: [146.83, 220.0, 293.66, 440.0, 587.33], // D power overdrive
        acoustic: [196.0, 246.94, 293.66, 392.0, 493.88], // G resonant acoustic
        lead: [329.63, 392.0, 493.88, 587.33, 659.25, 783.99], // E minor singing lead
        ambient: [261.63, 329.63, 392.0, 523.25, 659.25], // C major ethereal ambient
      };

      const scale = noteScales[toneCategory] || noteScales.clean;
      let noteIndex = 0;

      const playChordNote = () => {
        if (!ctx || !gainNodeRef.current) return;

        const freq = scale[noteIndex % scale.length];
        noteIndex++;

        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        // Waveform selection based on tone
        if (toneCategory === "drive") {
          osc.type = "sawtooth";
        } else if (toneCategory === "acoustic") {
          osc.type = "triangle";
        } else if (toneCategory === "lead") {
          osc.type = "square";
        } else {
          osc.type = "sine";
        }

        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // Envelope: soft attack, natural decay
        const now = ctx.currentTime;
        noteGain.gain.setValueAtTime(0.0001, now);
        noteGain.gain.exponentialRampToValueAtTime(0.18, now + 0.05);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

        osc.connect(noteGain);
        noteGain.connect(gainNodeRef.current);

        osc.start(now);
        osc.stop(now + 1.25);

        activeOscillatorsRef.current.push(osc);
        // Clean up old oscillators from ref array
        if (activeOscillatorsRef.current.length > 10) {
          activeOscillatorsRef.current.shift();
        }
      };

      // Play initial note immediately
      playChordNote();
      // Cycle notes every 420ms
      synthTimerRef.current = setInterval(playChordNote, 420);
    },
    [getOrCreateAudioContext, stopSynthesis],
  );

  // Playback control
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    if (activeTrack.audioUrl && nativeAudioRef.current) {
      nativeAudioRef.current.play().catch(() => {
        // Fallback to real synthesis if external URL cannot be fetched
        startSynthesis(activeTrack.toneCategory);
      });
    } else {
      startSynthesis(activeTrack.toneCategory);
    }
  }, [activeTrack, startSynthesis]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    stopSynthesis();
    if (nativeAudioRef.current) {
      nativeAudioRef.current.pause();
    }
  }, [stopSynthesis]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  }, [isPlaying, handlePause, handlePlay]);

  // Track switching
  const selectTrack = useCallback(
    (index: number) => {
      const nextIndex = (index + activeTracks.length) % activeTracks.length;
      setCurrentTrackIndex(nextIndex);
      setCurrentTime(0);
      if (isPlaying) {
        stopSynthesis();
        const nextTrack = activeTracks[nextIndex];
        if (nextTrack) {
          startSynthesis(nextTrack.toneCategory);
        }
      }
    },
    [activeTracks, isPlaying, startSynthesis, stopSynthesis],
  );

  const handleNextTrack = useCallback(() => {
    selectTrack(currentTrackIndex + 1);
  }, [currentTrackIndex, selectTrack]);

  const handlePrevTrack = useCallback(() => {
    selectTrack(currentTrackIndex - 1);
  }, [currentTrackIndex, selectTrack]);

  // Scrub timeline
  const handleScrub = useCallback((newTime: number) => {
    setCurrentTime(newTime);
    if (nativeAudioRef.current) {
      nativeAudioRef.current.currentTime = newTime;
    }
  }, []);

  // Update volume
  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(newVolume, audioCtxRef.current.currentTime);
    }
    if (nativeAudioRef.current) {
      nativeAudioRef.current.volume = newVolume;
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      setIsMuted(false);
      handleVolumeChange(volume || 0.8);
    } else {
      setIsMuted(true);
      if (gainNodeRef.current && audioCtxRef.current) {
        gainNodeRef.current.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
      }
      if (nativeAudioRef.current) {
        nativeAudioRef.current.volume = 0;
      }
    }
  }, [isMuted, volume, handleVolumeChange]);

  // Playback progress ticker
  useEffect(() => {
    if (!isPlaying) {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      return;
    }

    progressTimerRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= activeTrack.duration) {
          if (isLooping) {
            return 0;
          }
          handlePause();
          return 0;
        }
        return prev + 0.25;
      });
    }, 250);

    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [isPlaying, activeTrack.duration, isLooping, handlePause]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSynthesis();
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        void audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [stopSynthesis]);

  // Array of 24 bars for visualizer
  const visualizerBars = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div
      className={`vibe-audio-player ${className}`.trim()}
      role="region"
      aria-label={`Sound preview player for ${productName}`}
    >
      {/* Header */}
      <div className="vibe-audio-player__header">
        <div className="vibe-audio-player__heading-group">
          <div className="vibe-audio-player__badge-icon" aria-hidden>
            <Headphones size={20} />
          </div>
          <div>
            <h3 className="vibe-audio-player__title">Audio &amp; Tone Previews</h3>
            <p className="vibe-audio-player__subtitle">
              Listen to authentic studio sound samples and tone profiles for {productName} (
              {category})
            </p>
          </div>
        </div>

        <div className="vibe-audio-player__status-pill">
          <span
            className={`vibe-audio-player__status-dot${
              isPlaying ? " vibe-audio-player__status-dot--active" : ""
            }`}
            aria-hidden
          />
          <span>{isPlaying ? "Auditioning Tone" : "Studio Idle"}</span>
        </div>
      </div>

      {/* Track selector grid */}
      <div
        className="vibe-audio-player__tracklist"
        role="tablist"
        aria-label="Available audio tracks"
      >
        {activeTracks.map((track, idx) => {
          const isActive = idx === currentTrackIndex;
          return (
            <button
              key={track.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`vibe-audio-player__track-btn${
                isActive ? " vibe-audio-player__track-btn--active" : ""
              }`}
              onClick={() => selectTrack(idx)}
              aria-label={`Select tone track: ${track.title}, duration ${formatTime(track.duration)}`}
            >
              <div className="vibe-audio-player__track-top">
                <span className="vibe-audio-player__track-name">{track.title}</span>
                <span className="vibe-audio-player__track-duration">
                  {formatTime(track.duration)}
                </span>
              </div>
              <span className="vibe-audio-player__track-desc">{track.description}</span>
            </button>
          );
        })}
      </div>

      {/* Visualizer Display Card */}
      <div className="vibe-audio-player__visualizer-box">
        <div className="vibe-audio-player__now-playing">
          <span className="vibe-audio-player__now-title">{activeTrack.title}</span>
          <span className="vibe-audio-player__now-tone">
            Tone Character: {activeTrack.toneCategory.toUpperCase()}
          </span>
        </div>

        {/* Dynamic animated equalizer bars */}
        <div className="vibe-audio-player__bars" aria-hidden>
          {visualizerBars.map((barIdx) => {
            // Pseudo-random staggered delays for realistic equalizer bounce
            const animationDelay = `${(barIdx * 0.045) % 0.8}s`;
            const staticHeight = isPlaying ? undefined : `${12 + ((barIdx * 7) % 30)}%`;
            return (
              <span
                key={barIdx}
                className={`vibe-audio-player__bar${
                  isPlaying ? " vibe-audio-player__bar--active" : ""
                }`}
                style={{
                  animationDelay,
                  height: staticHeight,
                }}
              />
            );
          })}
        </div>

        {/* Timeline & Scrub bar */}
        <div className="vibe-audio-player__timeline">
          <span className="vibe-audio-player__time-text vibe-audio-player__time-text--current">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={activeTrack.duration}
            step={0.5}
            value={currentTime}
            onChange={(e) => handleScrub(parseFloat(e.target.value))}
            className="vibe-audio-player__scrub-input"
            aria-label="Audio timeline scrub bar"
            aria-valuemin={0}
            aria-valuemax={activeTrack.duration}
            aria-valuenow={currentTime}
            aria-valuetext={`${formatTime(currentTime)} of ${formatTime(activeTrack.duration)}`}
          />
          <span className="vibe-audio-player__time-text">{formatTime(activeTrack.duration)}</span>
        </div>
      </div>

      {/* Transport Controls */}
      <div className="vibe-audio-player__controls">
        <div className="vibe-audio-player__main-controls">
          <button
            type="button"
            className="vibe-audio-player__icon-btn"
            onClick={handlePrevTrack}
            aria-label="Previous track"
          >
            <SkipBack size={18} aria-hidden />
          </button>

          <button
            type="button"
            className="vibe-audio-player__play-btn"
            onClick={togglePlayPause}
            aria-label={isPlaying ? "Pause audio preview" : "Play audio preview"}
          >
            {isPlaying ? (
              <Pause size={24} fill="currentColor" aria-hidden />
            ) : (
              <Play size={24} fill="currentColor" style={{ marginLeft: "2px" }} aria-hidden />
            )}
          </button>

          <button
            type="button"
            className="vibe-audio-player__icon-btn"
            onClick={handleNextTrack}
            aria-label="Next track"
          >
            <SkipForward size={18} aria-hidden />
          </button>

          <button
            type="button"
            className={`vibe-audio-player__icon-btn${
              isLooping ? " vibe-audio-player__icon-btn--active" : ""
            }`}
            onClick={() => setIsLooping((prev) => !prev)}
            aria-label={isLooping ? "Disable track loop" : "Enable track loop"}
            aria-pressed={isLooping}
          >
            <Repeat size={17} aria-hidden />
          </button>
        </div>

        {/* Volume controls */}
        <div className="vibe-audio-player__volume-group">
          <button
            type="button"
            className="vibe-audio-player__icon-btn"
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX size={18} aria-hidden />
            ) : (
              <Volume2 size={18} aria-hidden />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="vibe-audio-player__volume-input"
            aria-label="Audio preview volume"
          />
        </div>
      </div>

      {/* Hidden audio element if external URL is provided */}
      {activeTrack.audioUrl ? (
        <audio
          ref={nativeAudioRef}
          src={activeTrack.audioUrl}
          preload="none"
          onEnded={() => {
            if (isLooping) {
              nativeAudioRef.current?.play().catch(() => {});
            } else {
              handlePause();
            }
          }}
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
}
