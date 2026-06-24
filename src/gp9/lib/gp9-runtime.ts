/**
 * GP-9 runtime — consolidated audio, MIDI, session, keyboard, and config logic.
 */
import * as Tone from "tone";
import type { Object3D } from "three";

// ============================================================================
// SESSION
// ============================================================================

export type Gp9MidiEvent = {
  kind: "noteOn" | "noteOff";
  midi: number;
  velocity: number;
  time: number;
};

export type Gp9StoredSession = {
  version: 1;
  takes: Gp9MidiEvent[][];
  tempo: number;
  loopPlayback: boolean;
  savedAt: number;
};

export const GP9_SESSION_STORAGE_KEY = "gp9-session-v1";
export const GP9_SESSION_STORAGE_MAX_BYTES = 3_500_000;

export function sessionDurationFromTakes(takes: Gp9MidiEvent[][]): number {
  let max = 0;
  for (const take of takes) {
    const last = take[take.length - 1];
    if (last && last.time > max) max = last.time;
  }
  return max + 0.75;
}

export function barQuantizedLoopEnd(durationSec: number, tempoBpm: number): number {
  const barSec = (60 / tempoBpm) * 4;
  if (barSec <= 0) return Math.max(durationSec, 1);
  return Math.max(barSec, Math.ceil(durationSec / barSec) * barSec);
}

export function flattenSessionTakes(takes: Gp9MidiEvent[][]): Gp9MidiEvent[] {
  return takes.flat();
}

export function encodeAudioBufferToWav(buffer: AudioBuffer): Blob {
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = channels * bytesPerSample;
  const samples = buffer.length;
  const dataSize = samples * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples; i++) {
    for (let ch = 0; ch < channels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i] ?? 0));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

export function serializeGp9Session(
  takes: Gp9MidiEvent[][],
  tempo: number,
  loopPlayback: boolean
): string {
  const payload: Gp9StoredSession = {
    version: 1,
    takes,
    tempo,
    loopPlayback,
    savedAt: Date.now(),
  };
  return JSON.stringify(payload);
}

export function parseGp9Session(raw: string): Gp9StoredSession | null {
  try {
    const data = JSON.parse(raw) as Gp9StoredSession;
    if (data.version !== 1 || !Array.isArray(data.takes)) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveGp9SessionToStorage(
  takes: Gp9MidiEvent[][],
  tempo: number,
  loopPlayback: boolean
): boolean {
  if (typeof window === "undefined") return false;
  try {
    const payload = serializeGp9Session(takes, tempo, loopPlayback);
    if (payload.length > GP9_SESSION_STORAGE_MAX_BYTES) return false;
    window.localStorage.setItem(GP9_SESSION_STORAGE_KEY, payload);
    return true;
  } catch {
    return false;
  }
}

export function loadGp9SessionFromStorage(): Gp9StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(GP9_SESSION_STORAGE_KEY);
    if (!raw) return null;
    return parseGp9Session(raw);
  } catch {
    return null;
  }
}

export async function renderSessionTakesToWav(
  takes: Gp9MidiEvent[][],
  options: { transpose?: number; tempo?: number; masterVolume?: number } = {}
): Promise<Blob | null> {
  const nonEmpty = takes.filter((t) => t.length > 0);
  if (nonEmpty.length === 0) return null;

  await Tone.loaded();

  const transpose = options.transpose ?? 0;
  const tempo = options.tempo ?? 120;
  const duration = barQuantizedLoopEnd(sessionDurationFromTakes(nonEmpty), tempo) + 1.5;

  const buffer = await Tone.Offline(() => {
    const out = new Tone.Volume((options.masterVolume ?? 0.72) * 20 - 20).toDestination();
    const reverb = new Tone.Reverb({ decay: 3.5, wet: 0.28 }).connect(out);
    const sampler = new Tone.Sampler({
      urls: buildSalamanderUrls(),
      release: 1.2,
    }).connect(reverb);

    for (const take of nonEmpty) {
      const pairs: [number, Gp9MidiEvent][] = take.map((e) => [e.time, e]);
      const part = new Tone.Part((time, event: Gp9MidiEvent) => {
        const midi = Math.max(MIDI_LOW, Math.min(MIDI_HIGH, event.midi + transpose));
        const name = midiToNoteName(midi);
        const gain = Math.max(0.05, Math.min(1, event.velocity / 127));
        if (event.kind === "noteOn") sampler.triggerAttack(name, time, gain);
        else sampler.triggerRelease(name, time);
      }, pairs);
      part.start(0);
    }
  }, duration);

  const audioBuffer = buffer.get();
  if (!audioBuffer) {
    throw new Error("Failed to render session audio");
  }
  return encodeAudioBufferToWav(audioBuffer);
}

export type Gp9PhraseStep = {
  active: boolean;
  midi: number;
};

export const PHRASE_STEP_COUNT = 16;

/** Pentatonic phrase notes from C4 upward for 16 steps. */
export const DEFAULT_PHRASE_NOTES = [
  60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96,
] as const;

export function createDefaultPhraseSteps(): Gp9PhraseStep[] {
  return DEFAULT_PHRASE_NOTES.map((midi) => ({ active: false, midi }));
}

export type Gp9ArpPattern = "up" | "down" | "updown";

// ============================================================================
// KEYBOARD MAP
// ============================================================================

export const MIDI_LOW = 21; // A0
export const MIDI_HIGH = 108; // C8
export const KEY_COUNT = MIDI_HIGH - MIDI_LOW + 1;

const NOTE_NAMES = ["C", "Cs", "D", "Ds", "E", "F", "Fs", "G", "Gs", "A", "As", "B"] as const;

export function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[midi % 12]}${octave}`;
}

export function isBlackKey(midi: number): boolean {
  const pc = midi % 12;
  return pc === 1 || pc === 3 || pc === 6 || pc === 8 || pc === 10;
}

/** White-key index from A0 for layout math. */
export function whiteKeyIndex(midi: number): number {
  let idx = 0;
  for (let m = MIDI_LOW; m < midi; m++) {
    if (!isBlackKey(m)) idx++;
  }
  return idx;
}

export const VISIBLE_KEY_START = 36; // C2
export const VISIBLE_KEY_END = 96; // C7

export function visibleWhiteKeyIndex(midi: number): number {
  let idx = 0;
  for (let m = VISIBLE_KEY_START; m < midi; m++) {
    if (!isBlackKey(m)) idx++;
  }
  return idx;
}

export type PianoKeyDef = {
  midi: number;
  name: string;
  black: boolean;
};

export const PIANO_KEYS: PianoKeyDef[] = Array.from({ length: KEY_COUNT }, (_, i) => {
  const midi = MIDI_LOW + i;
  return { midi, name: midiToNoteName(midi), black: isBlackKey(midi) };
});

export const VISIBLE_PIANO_KEYS = PIANO_KEYS.filter(
  (k) => k.midi >= VISIBLE_KEY_START && k.midi <= VISIBLE_KEY_END
);

/** Computer keyboard → MIDI (two octaves, standard DAW-style layout). */
export const QWERTY_TO_MIDI: Record<string, number> = {
  z: 48,
  s: 49,
  x: 50,
  d: 51,
  c: 52,
  v: 53,
  g: 54,
  b: 55,
  h: 56,
  n: 57,
  j: 58,
  m: 59,
  ",": 60,
  l: 61,
  ".": 62,
  ";": 63,
  "/": 64,
  q: 65,
  "2": 66,
  w: 67,
  "3": 68,
  e: 69,
  r: 70,
  "5": 71,
  t: 72,
  "6": 73,
  y: 74,
  u: 75,
  "7": 76,
  i: 77,
  "9": 78,
  o: 79,
  "0": 80,
  p: 81,
  "-": 82,
  "[": 83,
  "=": 84,
};

export const SALAMANDER_BASE = "https://tonejs.github.io/audio/salamander";

export function buildSalamanderUrls(): Record<string, string> {
  const urls: Record<string, string> = {};
  for (let midi = MIDI_LOW; midi <= MIDI_HIGH; midi++) {
    const name = midiToNoteName(midi);
    urls[name] = `${SALAMANDER_BASE}/${name}.mp3`;
  }
  return urls;
}

// ============================================================================
// MODEL CONFIG
// ============================================================================

/** GLB path — drop a Draco-compressed grand piano at public/models/gp9-grand.glb */
export const GP9_GRAND_GLB_PATH = "/models/gp9-grand.glb";

export type Gp9FinishId = "ebony" | "polished_ebony" | "white";

export type Gp9FinishPalette = {
  id: Gp9FinishId;
  label: string;
  body: string;
  bodyLight: string;
  accent: string;
  metalness: number;
  roughness: number;
};

export const GP9_FINISHES: Gp9FinishPalette[] = [
  {
    id: "ebony",
    label: "Ebony",
    body: "#0d0d0d",
    bodyLight: "#1a1a1a",
    accent: "#2a2a2a",
    metalness: 0.38,
    roughness: 0.42,
  },
  {
    id: "polished_ebony",
    label: "Polished Ebony",
    body: "#121218",
    bodyLight: "#222230",
    accent: "#3a3a48",
    metalness: 0.55,
    roughness: 0.28,
  },
  {
    id: "white",
    label: "White",
    body: "#e8e6e1",
    bodyLight: "#f5f3ee",
    accent: "#d0cec8",
    metalness: 0.22,
    roughness: 0.48,
  },
];

export function getFinish(id: Gp9FinishId): Gp9FinishPalette {
  return GP9_FINISHES.find((f) => f.id === id) ?? GP9_FINISHES[0];
}

export type Gp9CameraPresetId = "orbit" | "performance" | "keys" | "profile";

export type Gp9CameraPreset = {
  id: Gp9CameraPresetId;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
  fov?: number;
};

export const GP9_CAMERA_PRESETS: Gp9CameraPreset[] = [
  {
    id: "orbit",
    label: "Orbit",
    position: [0, 1.8, 5.2],
    target: [0, 0.2, 0],
  },
  {
    id: "performance",
    label: "Performance",
    position: [0, 1.75, 4.8],
    target: [0, 0.35, 0],
    fov: 40,
  },
  {
    id: "keys",
    label: "Keyboard",
    position: [0, 1.05, 2.35],
    target: [0, 0.68, 0.2],
    fov: 36,
  },
  {
    id: "profile",
    label: "Profile",
    position: [3.4, 1.35, 1.2],
    target: [0, 0.45, 0],
    fov: 42,
  },
];

export function getCameraPreset(id: Gp9CameraPresetId): Gp9CameraPreset {
  return GP9_CAMERA_PRESETS.find((p) => p.id === id) ?? GP9_CAMERA_PRESETS[0];
}

/** Mesh name patterns for GLB key discovery (MIDI number suffix). */
export const GP9_KEY_MESH_PATTERNS = [
  /^key[_-]?(\d{2,3})$/i,
  /^piano[_-]?key[_-]?(\d{2,3})$/i,
  /^white[_-]?key[_-]?(\d{2,3})$/i,
  /^black[_-]?key[_-]?(\d{2,3})$/i,
  /^key\.(\d{2,3})$/i,
] as const;

/** Note-name patterns: `key_A0`, `key_Cs4` (matches `midiToNoteName` output). */
export const GP9_KEY_NOTE_NAME_PATTERNS = [
  /^key[_-]?(Cs|Ds|Fs|Gs|As|[A-G])(-?\d+)$/i,
  /^piano[_-]?key[_-]?(Cs|Ds|Fs|Gs|As|[A-G])(-?\d+)$/i,
] as const;

export const GP9_PART_NAMES = {
  lid: ["lid", "top", "cover", "piano_lid"],
  sustain: ["pedal_sustain", "sustain_pedal", "pedal_1", "pedal_center"],
  soft: ["pedal_soft", "soft_pedal", "pedal_2", "pedal_left"],
  sostenuto: ["pedal_sostenuto", "sostenuto_pedal", "pedal_3", "pedal_right"],
} as const;

// ============================================================================
// PERFORMANCE MODES
// ============================================================================

export type Gp9PerformanceModeId = "recital" | "studio" | "ambient" | "night" | "showcase";

export type Gp9SceneChoreography = "static" | "night-orbit" | "showcase-rim";

export type Gp9ScenePostFX = {
  bloomIntensity: number;
  bloomThreshold: number;
  bloomSmoothing: number;
  bloomLevels: number;
  vignetteOffset: number;
  vignetteDarkness: number;
};

export type Gp9SceneLighting = {
  ambient: number;
  keyLightPosition: [number, number, number];
  keyLightIntensity: number;
  fillPosition: [number, number, number];
  fillIntensity: number;
  fillColor: string;
  environment: "city" | "sunset" | "dawn" | "night" | "warehouse" | "apartment";
  accent: string;
  activeKeyEmissive: number;
  playBoost: number;
};

/** Self-hosted HDRI paths (avoids external drei-assets CDN fetch failures). */
export const GP9_ENVIRONMENT_HDR: Record<Gp9SceneLighting["environment"], string> = {
  city: "/gp9/hdri/potsdamer_platz_1k.hdr",
  warehouse: "/gp9/hdri/empty_warehouse_01_1k.hdr",
  sunset: "/gp9/hdri/venice_sunset_1k.hdr",
  night: "/gp9/hdri/dikhololo_night_1k.hdr",
  apartment: "/gp9/hdri/lebombo_1k.hdr",
  dawn: "/gp9/hdri/venice_sunset_1k.hdr",
};

export function getEnvironmentHdrPath(environment: Gp9SceneLighting["environment"]): string {
  return GP9_ENVIRONMENT_HDR[environment];
}

export type Gp9PerformanceMode = {
  id: Gp9PerformanceModeId;
  label: string;
  description: string;
  sceneClass: string;
  reverbMul: number;
  brillianceMul: number;
  resonanceMul: number;
  chorusMul: number;
  stereoMul: number;
  releaseMul: number;
  delayWet: number;
  ambience: number;
  cameraPreset: Gp9CameraPresetId;
  choreography: Gp9SceneChoreography;
  postFx: Gp9ScenePostFX;
  lighting: Gp9SceneLighting;
};

export const GP9_PERFORMANCE_MODES: Gp9PerformanceMode[] = [
  {
    id: "recital",
    label: "Recital",
    description: "Concert hall presence with natural brilliance.",
    sceneClass: "gp9-scene--recital",
    reverbMul: 1.25,
    brillianceMul: 1.12,
    resonanceMul: 1.15,
    chorusMul: 0.4,
    stereoMul: 1.1,
    releaseMul: 1.05,
    delayWet: 0,
    ambience: 0.35,
    cameraPreset: "performance",
    choreography: "static",
    postFx: {
      bloomIntensity: 0.28,
      bloomThreshold: 0.55,
      bloomSmoothing: 0.35,
      bloomLevels: 6,
      vignetteOffset: 0.18,
      vignetteDarkness: 0.52,
    },
    lighting: {
      ambient: 0.4,
      keyLightPosition: [4, 6, 3],
      keyLightIntensity: 1.3,
      fillPosition: [-3, 4, -2],
      fillIntensity: 0.4,
      fillColor: "#ffe8cc",
      environment: "city",
      accent: "#ffc888",
      activeKeyEmissive: 0.15,
      playBoost: 0.35,
    },
  },
  {
    id: "studio",
    label: "Studio",
    description: "Dry, focused mix for precise playing.",
    sceneClass: "gp9-scene--studio",
    reverbMul: 0.55,
    brillianceMul: 1.05,
    resonanceMul: 0.75,
    chorusMul: 0.2,
    stereoMul: 0.65,
    releaseMul: 0.85,
    delayWet: 0.04,
    ambience: 0.12,
    cameraPreset: "profile",
    choreography: "static",
    postFx: {
      bloomIntensity: 0.12,
      bloomThreshold: 0.68,
      bloomSmoothing: 0.28,
      bloomLevels: 5,
      vignetteOffset: 0.14,
      vignetteDarkness: 0.4,
    },
    lighting: {
      ambient: 0.55,
      keyLightPosition: [3, 5, 4],
      keyLightIntensity: 1.05,
      fillPosition: [-2, 3, -3],
      fillIntensity: 0.25,
      fillColor: "#c8d8ff",
      environment: "warehouse",
      accent: "#88aaff",
      activeKeyEmissive: 0.1,
      playBoost: 0.15,
    },
  },
  {
    id: "ambient",
    label: "Ambient",
    description: "Lush space with extended tails.",
    sceneClass: "gp9-scene--ambient",
    reverbMul: 1.55,
    brillianceMul: 0.92,
    resonanceMul: 1.35,
    chorusMul: 1.2,
    stereoMul: 1.15,
    releaseMul: 1.45,
    delayWet: 0.22,
    ambience: 0.72,
    cameraPreset: "orbit",
    choreography: "static",
    postFx: {
      bloomIntensity: 0.36,
      bloomThreshold: 0.48,
      bloomSmoothing: 0.42,
      bloomLevels: 6,
      vignetteOffset: 0.2,
      vignetteDarkness: 0.5,
    },
    lighting: {
      ambient: 0.32,
      keyLightPosition: [2, 5, 5],
      keyLightIntensity: 0.95,
      fillPosition: [-4, 3, 1],
      fillIntensity: 0.55,
      fillColor: "#88bbff",
      environment: "sunset",
      accent: "#66aaff",
      activeKeyEmissive: 0.28,
      playBoost: 0.45,
    },
  },
  {
    id: "night",
    label: "Night",
    description: "Muted warmth for late-hour practice.",
    sceneClass: "gp9-scene--night",
    reverbMul: 0.85,
    brillianceMul: 0.72,
    resonanceMul: 0.95,
    chorusMul: 0.5,
    stereoMul: 0.55,
    releaseMul: 1.1,
    delayWet: 0.08,
    ambience: 0.2,
    cameraPreset: "orbit",
    choreography: "night-orbit",
    postFx: {
      bloomIntensity: 0.16,
      bloomThreshold: 0.62,
      bloomSmoothing: 0.32,
      bloomLevels: 5,
      vignetteOffset: 0.22,
      vignetteDarkness: 0.68,
    },
    lighting: {
      ambient: 0.22,
      keyLightPosition: [-2, 4, 2],
      keyLightIntensity: 0.65,
      fillPosition: [3, 2, -4],
      fillIntensity: 0.15,
      fillColor: "#5555aa",
      environment: "night",
      accent: "#6666cc",
      activeKeyEmissive: 0.08,
      playBoost: 0.2,
    },
  },
  {
    id: "showcase",
    label: "Showcase",
    description: "Wide, bright demo character with motion.",
    sceneClass: "gp9-scene--showcase",
    reverbMul: 1.1,
    brillianceMul: 1.28,
    resonanceMul: 1.05,
    chorusMul: 0.85,
    stereoMul: 1.25,
    releaseMul: 0.95,
    delayWet: 0.14,
    ambience: 0.55,
    cameraPreset: "performance",
    choreography: "showcase-rim",
    postFx: {
      bloomIntensity: 0.44,
      bloomThreshold: 0.46,
      bloomSmoothing: 0.38,
      bloomLevels: 6,
      vignetteOffset: 0.16,
      vignetteDarkness: 0.56,
    },
    lighting: {
      ambient: 0.38,
      keyLightPosition: [5, 6, 2],
      keyLightIntensity: 1.5,
      fillPosition: [-3, 4, 3],
      fillIntensity: 0.45,
      fillColor: "#ffaa66",
      environment: "apartment",
      accent: "#ff611a",
      activeKeyEmissive: 0.35,
      playBoost: 0.55,
    },
  },
];

export function getPerformanceMode(id: Gp9PerformanceModeId): Gp9PerformanceMode {
  return GP9_PERFORMANCE_MODES.find((m) => m.id === id) ?? GP9_PERFORMANCE_MODES[0];
}

// ============================================================================
// PRESETS
// ============================================================================

export type Gp9PresetId = "concert" | "intimate" | "pop" | "cinematic" | "experimental";

export type Gp9Preset = {
  id: Gp9PresetId;
  label: string;
  description: string;
  volume: number;
  reverb: number;
  brilliance: number;
  resonance: number;
  release: number;
  chorus: number;
  stereoWidth: number;
};

export const GP9_PRESETS: Gp9Preset[] = [
  {
    id: "concert",
    label: "Concert Grand",
    description: "Pristine hall tone with wide stereo image.",
    volume: 0.82,
    reverb: 0.42,
    brilliance: 0.58,
    resonance: 0.72,
    release: 0.55,
    chorus: 0,
    stereoWidth: 0.85,
  },
  {
    id: "intimate",
    label: "Intimate",
    description: "Warm close-mic character for quiet playing.",
    volume: 0.74,
    reverb: 0.22,
    brilliance: 0.38,
    resonance: 0.55,
    release: 0.62,
    chorus: 0.08,
    stereoWidth: 0.45,
  },
  {
    id: "pop",
    label: "Bright Pop",
    description: "Articulate attack with controlled room.",
    volume: 0.8,
    reverb: 0.18,
    brilliance: 0.78,
    resonance: 0.4,
    release: 0.35,
    chorus: 0.05,
    stereoWidth: 0.7,
  },
  {
    id: "cinematic",
    label: "Cinematic",
    description: "Lush ambience and long release tail.",
    volume: 0.76,
    reverb: 0.62,
    brilliance: 0.48,
    resonance: 0.8,
    release: 0.82,
    chorus: 0.18,
    stereoWidth: 0.95,
  },
  {
    id: "experimental",
    label: "Experimental",
    description: "Modulated tone with extended resonance.",
    volume: 0.7,
    reverb: 0.48,
    brilliance: 0.65,
    resonance: 0.9,
    release: 0.7,
    chorus: 0.35,
    stereoWidth: 1,
  },
];

export function getPreset(id: Gp9PresetId): Gp9Preset {
  return GP9_PRESETS.find((p) => p.id === id) ?? GP9_PRESETS[0];
}

// ============================================================================
// HAPTICS
// ============================================================================

/** Short vibration pulse scaled to note velocity (mobile / touch). */
export function isHapticsSupported(): boolean {
  return typeof navigator !== "undefined" && "vibrate" in navigator;
}

export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

export function triggerKeyHaptic(velocity = 96): void {
  if (!isHapticsSupported()) return;
  const ms = Math.round(6 + (Math.max(1, Math.min(127, velocity)) / 127) * 20);
  navigator.vibrate(ms);
}

export function triggerPedalHaptic(): void {
  if (!isHapticsSupported()) return;
  navigator.vibrate(12);
}

// ============================================================================
// KEY MESH MAP
// ============================================================================

export type Gp9MeshRegistry = {
  keys: Map<number, Object3D>;
  lid: Object3D | null;
  pedalSustain: Object3D | null;
  pedalSoft: Object3D | null;
  pedalSostenuto: Object3D | null;
};

function parseMidiFromNoteName(note: string, octave: number): number | null {
  const normalized =
    note.length === 1
      ? note.toUpperCase()
      : note.charAt(0).toUpperCase() + note.slice(1).toLowerCase();
  const pc = NOTE_NAMES.indexOf(normalized as (typeof NOTE_NAMES)[number]);
  if (pc < 0) return null;
  const midi = (octave + 1) * 12 + pc;
  if (midi < MIDI_LOW || midi > MIDI_HIGH) return null;
  return midi;
}

function parseMidiFromName(name: string): number | null {
  for (const pattern of GP9_KEY_MESH_PATTERNS) {
    const match = name.match(pattern);
    if (match?.[1]) {
      const midi = Number.parseInt(match[1], 10);
      if (midi >= MIDI_LOW && midi <= MIDI_HIGH) return midi;
    }
  }
  for (const pattern of GP9_KEY_NOTE_NAME_PATTERNS) {
    const match = name.match(pattern);
    if (match?.[1] && match[2]) {
      const midi = parseMidiFromNoteName(match[1], Number.parseInt(match[2], 10));
      if (midi !== null) return midi;
    }
  }
  return null;
}

function matchesPart(name: string, aliases: readonly string[]): boolean {
  const lower = name.toLowerCase();
  return aliases.some((a) => lower.includes(a));
}

/** Walk a GLB scene and map key meshes by `midiToNoteName` (e.g. `A0`, `Cs4`). */
export function mapGltfKeysToKeyboard(root: Object3D): Record<string, Object3D> {
  const registry = buildMeshRegistry(root);
  const out: Record<string, Object3D> = {};
  registry.keys.forEach((obj, midi) => {
    out[midiToNoteName(midi)] = obj;
  });
  return out;
}

export function buildMeshRegistry(root: Object3D): Gp9MeshRegistry {
  const registry: Gp9MeshRegistry = {
    keys: new Map(),
    lid: null,
    pedalSustain: null,
    pedalSoft: null,
    pedalSostenuto: null,
  };

  root.traverse((obj) => {
    const name = obj.name;
    if (!name) return;

    const midi = parseMidiFromName(name);
    if (midi !== null) {
      registry.keys.set(midi, obj);
      return;
    }

    if (!registry.lid && matchesPart(name, GP9_PART_NAMES.lid)) registry.lid = obj;
    if (!registry.pedalSustain && matchesPart(name, GP9_PART_NAMES.sustain))
      registry.pedalSustain = obj;
    if (!registry.pedalSoft && matchesPart(name, GP9_PART_NAMES.soft)) registry.pedalSoft = obj;
    if (!registry.pedalSostenuto && matchesPart(name, GP9_PART_NAMES.sostenuto))
      registry.pedalSostenuto = obj;
  });

  return registry;
}

export function getKeyPressOffset(isBlack: boolean): { y: number; rotX: number } {
  return isBlack ? { y: -0.018, rotX: 0.035 } : { y: -0.014, rotX: 0.028 };
}

// ============================================================================
// WEB MIDI
// ============================================================================

export type Gp9MidiHandlers = {
  onNoteOn: (midi: number, velocity: number) => void;
  onNoteOff: (midi: number) => void;
  onSustain: (on: boolean) => void;
  onSoftPedal: (on: boolean) => void;
  onSostenuto: (on: boolean) => void;
};

export function isWebMidiSupported(): boolean {
  return typeof navigator !== "undefined" && "requestMIDIAccess" in navigator;
}

function clampMidi(note: number) {
  return Math.max(MIDI_LOW, Math.min(MIDI_HIGH, note));
}

export class Gp9WebMidi {
  private access: MIDIAccess | null = null;
  private boundInputs = new Map<string, MIDIInput>();

  constructor(private handlers: Gp9MidiHandlers) {}

  async connect(): Promise<string | null> {
    if (!isWebMidiSupported()) return null;

    this.access = await navigator.requestMIDIAccess({ sysex: false });
    this.access.onstatechange = () => this.bindInputs();
    this.bindInputs();

    const names = [...this.boundInputs.values()].map((i) => i.name).filter(Boolean);
    return names.length > 0 ? names.join(" · ") : "MIDI Input";
  }

  private bindInputs() {
    if (!this.access) return;

    for (const input of this.access.inputs.values()) {
      if (this.boundInputs.has(input.id)) continue;
      input.onmidimessage = (event) => this.handleMessage(event);
      this.boundInputs.set(input.id, input);
    }

    for (const [id, input] of this.boundInputs) {
      if (!this.access.inputs.has(id)) {
        input.onmidimessage = null;
        this.boundInputs.delete(id);
      }
    }
  }

  private handleMessage(event: MIDIMessageEvent) {
    const data = event.data;
    if (!data || data.length < 2) return;

    const status = data[0];
    const data1 = data[1];
    const data2 = data.length > 2 ? data[2] : 0;
    const cmd = status & 0xf0;

    if (cmd === 0x90 && data2 > 0) {
      this.handlers.onNoteOn(clampMidi(data1), data2);
      return;
    }

    if (cmd === 0x80 || (cmd === 0x90 && data2 === 0)) {
      this.handlers.onNoteOff(clampMidi(data1));
      return;
    }

    if (cmd === 0xb0) {
      if (data1 === 64) this.handlers.onSustain(data2 >= 64);
      if (data1 === 66) this.handlers.onSostenuto(data2 >= 64);
      if (data1 === 67) this.handlers.onSoftPedal(data2 >= 64);
    }
  }

  disconnect() {
    for (const input of this.boundInputs.values()) {
      input.onmidimessage = null;
    }
    this.boundInputs.clear();
    if (this.access) {
      this.access.onstatechange = null;
      this.access = null;
    }
  }

  getInputCount() {
    return this.boundInputs.size;
  }
}

// ============================================================================
// SESSION RECORDER
// ============================================================================

export class Gp9SessionRecorder {
  private takes: Gp9MidiEvent[][] = [];
  private currentTake: Gp9MidiEvent[] = [];
  private recording = false;
  private overdubMode = false;
  private recordStart = 0;
  private recorder: MediaRecorder | null = null;
  private recordChunks: Blob[] = [];
  private lastAudioUrl: string | null = null;

  private playbackParts: Tone.Part[] = [];
  private playbackEndId: number | null = null;
  private paused = false;
  private loopTempo = 120;

  private phraseSequence: Tone.Sequence | null = null;
  private arpLoop: Tone.Loop | null = null;
  private arpHeld = new Set<number>();
  private arpIndex = 0;
  private arpDirection = 1;
  private arpEnabled = false;
  private arpPattern: Gp9ArpPattern = "up";

  onArpNote: ((midi: number, time: number) => void) | null = null;
  onPlaybackEnd: (() => void) | null = null;

  isRecording() {
    return this.recording;
  }

  isOverdubbing() {
    return this.recording && this.overdubMode;
  }

  getTakes() {
    return this.takes.map((take) => [...take]);
  }

  setTakes(takes: Gp9MidiEvent[][]) {
    this.takes = takes.map((take) => [...take]);
    this.currentTake = [];
  }

  /** @deprecated Use getTakes() — returns flattened events for legacy callers */
  getEvents() {
    return flattenSessionTakes(this.takes);
  }

  getTakeCount() {
    return this.takes.length;
  }

  getEventCount() {
    return flattenSessionTakes(this.takes).length + this.currentTake.length;
  }

  getLastAudioUrl() {
    return this.lastAudioUrl;
  }

  startRecording(engine: Gp9PianoEngine, options?: { overdub?: boolean; clear?: boolean }) {
    const overdub = options?.overdub ?? false;
    const clear = options?.clear ?? !overdub;

    if (clear) {
      this.takes = [];
    }

    this.currentTake = [];
    this.recording = true;
    this.overdubMode = overdub;
    this.recordStart = Tone.now();

    if (overdub && this.takes.length > 0) {
      this.playSession(engine, this.takes, true, this.loopTempo);
    } else {
      this.stopPlayback(engine);
    }

    const dest = (Tone.getContext().rawContext as AudioContext).createMediaStreamDestination();
    engine.connectRecorderOutput(dest);

    this.recordChunks = [];
    this.recorder = new MediaRecorder(dest.stream);
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.recordChunks.push(e.data);
    };
    this.recorder.start();
  }

  startOverdub(engine: Gp9PianoEngine) {
    if (this.takes.length === 0) return false;
    this.startRecording(engine, { overdub: true });
    return true;
  }

  async stopRecordingAsync(engine: Gp9PianoEngine) {
    const wasOverdub = this.overdubMode;
    this.recording = false;
    this.overdubMode = false;

    if (wasOverdub) {
      this.stopPlayback(engine);
    }

    if (this.currentTake.length > 0) {
      this.takes.push([...this.currentTake]);
    }
    this.currentTake = [];

    if (!this.recorder) {
      engine.disconnectRecorderOutput();
      return { takes: this.getTakes(), audioUrl: null as string | null };
    }

    return new Promise<{ takes: Gp9MidiEvent[][]; audioUrl: string | null }>((resolve) => {
      const rec = this.recorder!;
      rec.onstop = () => {
        const blob = new Blob(this.recordChunks, { type: "audio/webm" });
        if (this.lastAudioUrl) URL.revokeObjectURL(this.lastAudioUrl);
        this.lastAudioUrl = URL.createObjectURL(blob);
        engine.disconnectRecorderOutput();
        this.recorder = null;
        resolve({ takes: this.getTakes(), audioUrl: this.lastAudioUrl });
      };
      rec.stop();
    });
  }

  captureNoteOn(midi: number, velocity: number) {
    if (!this.recording) return;
    this.currentTake.push({
      kind: "noteOn",
      midi,
      velocity,
      time: Tone.now() - this.recordStart,
    });
  }

  captureNoteOff(midi: number) {
    if (!this.recording) return;
    this.currentTake.push({
      kind: "noteOff",
      midi,
      velocity: 0,
      time: Tone.now() - this.recordStart,
    });
  }

  private clearPlaybackEndSchedule() {
    if (this.playbackEndId !== null) {
      Tone.getTransport().clear(this.playbackEndId);
      this.playbackEndId = null;
    }
  }

  stopPlayback(engine: Gp9PianoEngine) {
    this.clearPlaybackEndSchedule();
    for (const part of this.playbackParts) {
      part.stop();
      part.dispose();
    }
    this.playbackParts = [];
    this.paused = false;
    engine.releaseAll();
  }

  isPlayingBack() {
    return this.playbackParts.length > 0;
  }

  isPaused() {
    return this.paused && this.playbackParts.length > 0;
  }

  pausePlayback() {
    if (!this.isPlayingBack() || this.paused) return false;
    Tone.getTransport().pause();
    this.paused = true;
    return true;
  }

  resumePlayback() {
    if (!this.paused) return false;
    Tone.getTransport().start();
    this.paused = false;
    return true;
  }

  playSession(
    engine: Gp9PianoEngine,
    takes: Gp9MidiEvent[][],
    loop = false,
    tempo = 120
  ) {
    this.stopPlayback(engine);
    const nonEmpty = takes.filter((t) => t.length > 0);
    if (nonEmpty.length === 0) return;

    this.loopTempo = tempo;
    Tone.getTransport().bpm.value = tempo;

    const duration = sessionDurationFromTakes(nonEmpty);
    const loopEnd = barQuantizedLoopEnd(duration, tempo);

    for (const take of nonEmpty) {
      const pairs: [number, Gp9MidiEvent][] = take.map((e) => [e.time, e]);
      const part = new Tone.Part((time, event: Gp9MidiEvent) => {
        if (event.kind === "noteOn") {
          engine.playbackNoteOn(event.midi, event.velocity, time);
        } else {
          engine.playbackNoteOff(event.midi, time);
        }
      }, pairs);

      part.loop = loop;
      if (loop) part.loopEnd = loopEnd;
      this.playbackParts.push(part);
    }

    const startAt = Tone.now() + 0.05;
    for (const part of this.playbackParts) {
      part.start(startAt);
    }

    if (!loop) {
      this.playbackEndId = Tone.getTransport().scheduleOnce(() => {
        this.playbackEndId = null;
        this.stopPlayback(engine);
        this.onPlaybackEnd?.();
      }, startAt + loopEnd);
    }

    if (Tone.getTransport().state !== "started") Tone.getTransport().start();
    this.paused = false;
  }

  stopPhraseLoop() {
    this.phraseSequence?.stop();
    this.phraseSequence?.dispose();
    this.phraseSequence = null;
  }

  isPhraseLooping() {
    return this.phraseSequence !== null;
  }

  startPhraseLoop(
    engine: Gp9PianoEngine,
    steps: Gp9PhraseStep[],
    tempo: number,
    onStep?: (index: number) => void
  ) {
    this.stopPhraseLoop();
    Tone.getTransport().bpm.value = tempo;

    this.phraseSequence = new Tone.Sequence(
      (time, stepIndex) => {
        const idx = stepIndex as number;
        const step = steps[idx];
        onStep?.(idx);
        if (!step?.active) return;
        engine.playbackNoteOn(step.midi, 82, time);
        const offTime = time + 0.14;
        engine.playbackNoteOff(step.midi, offTime);
      },
      Array.from({ length: 16 }, (_, i) => i),
      "16n"
    );

    this.phraseSequence.loop = true;
    this.phraseSequence.start(0);
    Tone.getTransport().loop = true;
    Tone.getTransport().loopEnd = "1m";
    if (Tone.getTransport().state !== "started") Tone.getTransport().start();
  }

  setArp(enabled: boolean, pattern: Gp9ArpPattern) {
    this.arpEnabled = enabled;
    this.arpPattern = pattern;
    if (!enabled) this.stopArp();
  }

  arpNoteOn(midi: number) {
    this.arpHeld.add(midi);
    if (this.arpEnabled && this.arpHeld.size > 0) this.startArpLoop();
  }

  arpNoteOff(midi: number) {
    this.arpHeld.delete(midi);
    if (this.arpHeld.size === 0) this.stopArp();
  }

  private getArpOrder(): number[] {
    const notes = [...this.arpHeld].sort((a, b) => a - b);
    if (notes.length === 0) return [];
    if (this.arpPattern === "up") return notes;
    if (this.arpPattern === "down") return [...notes].reverse();
    return notes;
  }

  private startArpLoop() {
    if (this.arpLoop) return;
    this.arpIndex = 0;
    this.arpDirection = 1;

    this.arpLoop = new Tone.Loop((time) => {
      const order = this.getArpOrder();
      if (order.length === 0) return;

      let idx: number;
      if (this.arpPattern === "updown" && order.length > 1) {
        idx = this.arpIndex;
        if (idx >= order.length) {
          this.arpDirection = -1;
          this.arpIndex = order.length - 2;
          idx = this.arpIndex;
        } else if (idx < 0) {
          this.arpDirection = 1;
          this.arpIndex = 1;
          idx = this.arpIndex;
        } else {
          this.arpIndex += this.arpDirection;
        }
      } else {
        idx = this.arpIndex % order.length;
        this.arpIndex++;
      }

      const midi = order[Math.max(0, Math.min(order.length - 1, idx))] ?? order[0];
      this.onArpNote?.(midi, time);
    }, "8n");

    this.arpLoop.start(0);
    if (Tone.getTransport().state !== "started") Tone.getTransport().start();
  }

  stopArp() {
    this.arpLoop?.stop();
    this.arpLoop?.dispose();
    this.arpLoop = null;
    this.arpIndex = 0;
  }
}

// ============================================================================
// PIANO ENGINE
// ============================================================================

export type Gp9TouchCurve = "linear" | "soft" | "hard";
export type Gp9SplitVoice = "piano" | "pad";

export function applyTouchCurve(velocity: number, curve: Gp9TouchCurve): number {
  const n = Math.max(0, Math.min(1, velocity / 127));
  let curved: number;
  switch (curve) {
    case "soft":
      curved = Math.pow(n, 1.65);
      break;
    case "hard":
      curved = Math.pow(n, 0.55);
      break;
    default:
      curved = n;
  }
  return Math.max(1, Math.min(127, Math.round(curved * 127)));
}

export type Gp9EngineParams = {
  masterVolume: number;
  reverb: number;
  brilliance: number;
  resonance: number;
  release: number;
  chorus: number;
  stereoWidth: number;
  velocityCurve: number;
  touchCurve: Gp9TouchCurve;
  delay: number;
  layerBlend: number;
  splitPoint: number | null;
  splitLowVoice: Gp9SplitVoice;
  splitHighVoice: Gp9SplitVoice;
  sustain: boolean;
  softPedal: boolean;
  sostenuto: boolean;
  transpose: number;
  lidOpen: number;
  roomSize: number;
  keyOffNoise: number;
  headphoneMode: boolean;
  performanceModeId: Gp9PerformanceModeId;
};

const DEFAULT_PARAMS: Gp9EngineParams = {
  masterVolume: 0.82,
  reverb: 0.42,
  brilliance: 0.58,
  resonance: 0.72,
  release: 0.55,
  chorus: 0.08,
  stereoWidth: 0.85,
  velocityCurve: 0.65,
  touchCurve: "linear",
  delay: 0.12,
  layerBlend: 0,
  splitPoint: null,
  splitLowVoice: "pad",
  splitHighVoice: "piano",
  sustain: false,
  softPedal: false,
  sostenuto: false,
  transpose: 0,
  lidOpen: 0.65,
  roomSize: 0.5,
  keyOffNoise: 0.25,
  headphoneMode: false,
  performanceModeId: "recital",
};

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

export class Gp9PianoEngine {
  private static instance: Gp9PianoEngine | null = null;

  private ready = false;
  private loading = false;
  private sampler: Tone.Sampler | null = null;
  private padSynth: Tone.PolySynth<Tone.AMSynth> | null = null;
  private crossFade: Tone.CrossFade | null = null;
  private padGain!: Tone.Volume;
  private masterVolume!: Tone.Volume;
  private reverb!: Tone.Reverb;
  private chorus!: Tone.Chorus;
  private delay!: Tone.FeedbackDelay;
  private eq!: Tone.EQ3;
  private widener!: Tone.StereoWidener;
  private resonanceBus!: Tone.Gain;
  private keyOffNoise!: Tone.NoiseSynth;
  private metroClick!: Tone.MembraneSynth;
  private metroLoop: Tone.Loop | null = null;
  private metroRunning = false;

  private activeNotes = new Map<number, number>();
  private padActiveNotes = new Set<number>();
  private sustainedNotes = new Set<number>();
  private sostenutoNotes = new Set<number>();
  private params: Gp9EngineParams = { ...DEFAULT_PARAMS };
  private basePresetId: Gp9PresetId = "concert";
  private recorderDest: MediaStreamAudioDestinationNode | null = null;
  private arpEnabled = false;
  onVisualNote: ((kind: "noteOn" | "noteOff", midi: number) => void) | null = null;
  onPlaybackEnd: (() => void) | null = null;
  readonly session = new Gp9SessionRecorder();

  constructor() {
    this.session.onArpNote = (midi, time) => {
      this.playbackNoteOn(midi, 78, time);
      this.playbackNoteOff(midi, time + 0.1);
    };
    this.session.onPlaybackEnd = () => {
      this.onPlaybackEnd?.();
    };
  }

  static getInstance() {
    if (!Gp9PianoEngine.instance) {
      Gp9PianoEngine.instance = new Gp9PianoEngine();
    }
    return Gp9PianoEngine.instance;
  }

  private initChain() {
    if (this.masterVolume) return;

    this.masterVolume = new Tone.Volume(-6);
    this.reverb = new Tone.Reverb({ decay: 4.2, wet: 0.3 });
    this.chorus = new Tone.Chorus({ frequency: 1.2, delayTime: 3.5, depth: 0.2, wet: 0 }).start();
    this.delay = new Tone.FeedbackDelay({ delayTime: 0.12, feedback: 0.22, wet: 0 });
    this.eq = new Tone.EQ3({ low: 0, mid: 0, high: 0 });
    this.widener = new Tone.StereoWidener(0.5);
    this.resonanceBus = new Tone.Gain(0.15);
    this.padGain = new Tone.Volume(-14);
    this.crossFade = new Tone.CrossFade(0);

    this.resonanceBus.connect(this.crossFade.a);
    this.padGain.connect(this.crossFade.b);
    this.crossFade.chain(
      this.delay,
      this.reverb,
      this.chorus,
      this.eq,
      this.widener,
      this.masterVolume,
      Tone.getDestination()
    );

    this.keyOffNoise = new Tone.NoiseSynth({
      envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.02 },
    }).connect(this.masterVolume);
    this.keyOffNoise.volume.value = -32;

    this.metroClick = new Tone.MembraneSynth({
      pitchDecay: 0.008,
      octaves: 2,
      envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.01 },
    }).toDestination();
    this.metroClick.volume.value = -22;
  }

  async ensureStarted() {
    if (typeof window === "undefined") return;
    this.initChain();
    if (this.ready || this.loading) return;

    this.loading = true;
    await Tone.start();

    const urls = buildSalamanderUrls();
    this.sampler = new Tone.Sampler({
      urls,
      release: 1.2,
      onload: () => {
        this.ready = true;
        this.loading = false;
        this.applyPresetParams(this.params);
      },
    }).connect(this.resonanceBus);

    this.padSynth = new Tone.PolySynth(Tone.AMSynth, {
      harmonicity: 2.5,
      oscillator: { type: "sine" },
      envelope: { attack: 0.04, decay: 0.35, sustain: 0.45, release: 1.4 },
      modulationEnvelope: { attack: 0.02, decay: 0.25, sustain: 0, release: 0.3 },
    }).connect(this.padGain);

    window.setTimeout(() => {
      if (!this.ready) {
        this.ready = true;
        this.loading = false;
      }
    }, 8000);
  }

  isReady() {
    return this.ready;
  }

  applyPreset(presetId: Gp9PresetId) {
    this.basePresetId = presetId;
    const preset = getPreset(presetId);
    this.params = {
      ...this.params,
      masterVolume: preset.volume,
      reverb: preset.reverb,
      brilliance: preset.brilliance,
      resonance: preset.resonance,
      release: preset.release,
      chorus: preset.chorus,
      stereoWidth: preset.stereoWidth,
    };
    this.applyPresetParams(this.params);
  }

  setParams(partial: Partial<Gp9EngineParams>) {
    const prevSostenuto = this.params.sostenuto;
    this.params = { ...this.params, ...partial };

    if (partial.sostenuto !== undefined && partial.sostenuto !== prevSostenuto) {
      this.handleSostenutoChange(partial.sostenuto);
    }

    this.applyPresetParams(this.params);
  }

  private handleSostenutoChange(on: boolean) {
    if (on) {
      this.activeNotes.forEach((_, midi) => this.sostenutoNotes.add(midi));
      return;
    }

    this.sostenutoNotes.forEach((midi) => {
      if (!this.activeNotes.has(midi) && !this.params.sustain) {
        this.triggerRelease(midi);
      }
    });
    this.sostenutoNotes.clear();
  }

  private getModeAdjustedParams(p: Gp9EngineParams) {
    const mode = getPerformanceMode(p.performanceModeId);
    const lid = p.lidOpen;
    const room = p.roomSize;

    return {
      masterVolume: p.masterVolume * (p.headphoneMode ? 0.78 : 1),
      reverb: clamp01(p.reverb * mode.reverbMul * (0.7 + room * 0.6) * (0.85 + lid * 0.3)),
      brilliance: clamp01(p.brilliance * mode.brillianceMul * (0.9 + lid * 0.15)),
      resonance: clamp01(p.resonance * mode.resonanceMul * (0.8 + lid * 0.35)),
      release: clamp01(p.release * mode.releaseMul),
      chorus: clamp01(p.chorus * mode.chorusMul),
      stereoWidth: clamp01(p.stereoWidth * mode.stereoMul * (p.headphoneMode ? 0.45 : 1)),
      delayWet: mode.delayWet,
    };
  }

  private applyPresetParams(p: Gp9EngineParams) {
    if (!this.masterVolume) return;

    const adj = this.getModeAdjustedParams(p);

    this.masterVolume.volume.rampTo(Tone.gainToDb(adj.masterVolume), 0.08);
    this.reverb.wet.rampTo(adj.reverb * 0.75, 0.08);
    this.reverb.decay = 2 + adj.resonance * 6 + p.roomSize * 2;
    this.chorus.wet.rampTo(adj.chorus, 0.08);
    this.applyDelayParams(p);
    this.crossFade?.fade.rampTo(p.splitPoint !== null ? 0 : p.layerBlend, 0.12);
    this.eq.high.rampTo((adj.brilliance - 0.5) * 12 - (p.softPedal ? 4 : 0), 0.08);
    this.eq.low.rampTo((0.5 - adj.brilliance) * 4, 0.08);
    this.widener.width.rampTo(adj.stereoWidth, 0.08);
    this.resonanceBus.gain.rampTo(0.08 + adj.resonance * 0.2, 0.08);
    this.keyOffNoise.volume.value = -38 + p.keyOffNoise * 18;

    if (this.sampler) {
      const releaseSec = 0.2 + adj.release * 3.5;
      this.sampler.release = this.params.sustain ? releaseSec * 2.8 : releaseSec;
    }
  }

  setSustain(on: boolean) {
    this.params.sustain = on;
    if (this.sampler) {
      const adj = this.getModeAdjustedParams(this.params);
      const releaseSec = 0.2 + adj.release * 3.5;
      this.sampler.release = on ? releaseSec * 2.8 : releaseSec;
    }
    if (!on) {
      this.sustainedNotes.forEach((midi) => {
        if (!this.activeNotes.has(midi) && !this.sostenutoNotes.has(midi)) {
          this.triggerRelease(midi);
        }
      });
      this.sustainedNotes.clear();
    }
  }

  setSoftPedal(on: boolean) {
    this.params.softPedal = on;
    this.applyPresetParams(this.params);
  }

  setMetronome(on: boolean, tempo: number, level: number) {
    Tone.getTransport().bpm.value = tempo;
    const gain = -28 + level * 14;
    this.metroClick.volume.rampTo(gain, 0.05);

    if (on && !this.metroRunning) {
      if (!this.metroLoop) {
        this.metroLoop = new Tone.Loop((time) => {
          this.metroClick.triggerAttackRelease("C2", "32n", time);
        }, "4n");
      }
      this.metroLoop.start(0);
      Tone.getTransport().start();
      this.metroRunning = true;
      return;
    }

    if (!on && this.metroRunning) {
      this.metroLoop?.stop();
      Tone.getTransport().stop();
      Tone.getTransport().position = 0;
      this.metroRunning = false;
    }
  }

  private applyDelayParams(p: Gp9EngineParams) {
    if (!this.delay) return;
    const adj = this.getModeAdjustedParams(p);
    const wet = clamp01(p.delay * 0.75 + adj.delayWet * 0.35);
    this.delay.wet.rampTo(wet, 0.08);
    this.delay.delayTime.rampTo(0.05 + p.delay * 0.55, 0.08);
    this.delay.feedback.rampTo(p.delay * 0.4, 0.08);
  }

  setTempo(tempo: number) {
    Tone.getTransport().bpm.value = tempo;
  }

  private velocityToGain(velocity: number): number {
    const curve = this.params.velocityCurve;
    const normalized = velocity / 127;
    const curved = Math.pow(normalized, 1.4 - curve * 0.8);
    return 0.15 + curved * 0.85;
  }

  private voiceForMidi(midi: number): Gp9SplitVoice | "blend" {
    const split = this.params.splitPoint;
    if (split === null) return "blend";
    return midi < split ? this.params.splitLowVoice : this.params.splitHighVoice;
  }

  private shapedVelocity(velocity: number): number {
    return applyTouchCurve(velocity, this.params.touchCurve);
  }

  private triggerPianoAttack(midi: number, velocity: number, time?: number) {
    if (!this.sampler) return;
    const transposed = this.transposeMidi(midi);
    const vel = this.shapedVelocity(velocity);
    const gain = this.velocityToGain(vel);
    const name = midiToNoteName(transposed);
    this.sampler.triggerAttack(name, time ?? Tone.now(), gain);
  }

  private triggerPianoRelease(midi: number, time?: number) {
    if (!this.sampler) return;
    const transposed = this.transposeMidi(midi);
    const name = midiToNoteName(transposed);
    this.sampler.triggerRelease(name, time ?? Tone.now() + 0.02);
  }

  private triggerPadAttack(midi: number, velocity: number, time?: number) {
    if (!this.padSynth) return;
    const transposed = this.transposeMidi(midi);
    const vel = this.shapedVelocity(velocity);
    const gain = this.velocityToGain(vel) * 0.55;
    const freq = Tone.Frequency(transposed, "midi").toFrequency();
    this.padSynth.triggerAttack(freq, time ?? Tone.now(), gain);
    this.padActiveNotes.add(midi);
  }

  private triggerPadRelease(midi: number, time?: number) {
    if (!this.padSynth || !this.padActiveNotes.has(midi)) return;
    const transposed = this.transposeMidi(midi);
    const freq = Tone.Frequency(transposed, "midi").toFrequency();
    this.padSynth.triggerRelease(freq, time ?? Tone.now() + 0.02);
    this.padActiveNotes.delete(midi);
  }

  private playVoicesOn(midi: number, velocity: number, time?: number) {
    const voice = this.voiceForMidi(midi);
    if (voice === "blend") {
      this.triggerPianoAttack(midi, velocity, time);
      if (this.params.layerBlend > 0.02) {
        this.triggerPadAttack(midi, velocity, time);
      }
      return;
    }
    if (voice === "piano") this.triggerPianoAttack(midi, velocity, time);
    else this.triggerPadAttack(midi, velocity, time);
  }

  private playVoicesOff(midi: number, time?: number) {
    const voice = this.voiceForMidi(midi);
    if (voice === "blend") {
      this.triggerPianoRelease(midi, time);
      this.triggerPadRelease(midi, time);
      return;
    }
    if (voice === "piano") this.triggerPianoRelease(midi, time);
    else this.triggerPadRelease(midi, time);
  }

  private transposeMidi(midi: number) {
    return Math.max(MIDI_LOW, Math.min(MIDI_HIGH, midi + this.params.transpose));
  }

  noteOn(midi: number, velocity = 100) {
    if (!this.sampler || !this.ready) return;
    const vel = Math.max(1, Math.min(127, velocity));
    this.activeNotes.set(midi, vel);
    this.sustainedNotes.add(midi);
    this.session.captureNoteOn(midi, vel);

    if (this.arpEnabled) {
      this.session.arpNoteOn(midi);
      return;
    }

    this.playVoicesOn(midi, vel);
  }

  noteOff(midi: number) {
    if (!this.sampler || !this.ready) return;
    this.activeNotes.delete(midi);
    this.session.captureNoteOff(midi);

    if (this.arpEnabled) {
      this.session.arpNoteOff(midi);
      return;
    }

    if (this.params.keyOffNoise > 0.05) {
      this.keyOffNoise.triggerAttackRelease(0.03, Tone.now(), 0.08 + this.params.keyOffNoise * 0.2);
    }

    if (this.params.sustain || this.sostenutoNotes.has(midi)) {
      return;
    }

    this.playVoicesOff(midi);
    this.sustainedNotes.delete(midi);
  }

  private triggerRelease(midi: number) {
    this.playVoicesOff(midi);
  }

  releaseAll() {
    if (!this.sampler) return;
    for (const midi of this.activeNotes.keys()) {
      this.onVisualNote?.("noteOff", midi);
    }
    this.sampler.releaseAll();
    this.padSynth?.releaseAll();
    this.activeNotes.clear();
    this.padActiveNotes.clear();
    this.sustainedNotes.clear();
    this.sostenutoNotes.clear();
  }

  connectRecorderOutput(dest: MediaStreamAudioDestinationNode) {
    this.recorderDest = dest;
    this.masterVolume?.connect(dest);
  }

  disconnectRecorderOutput() {
    if (this.recorderDest && this.masterVolume) {
      this.masterVolume.disconnect(this.recorderDest);
    }
    this.recorderDest = null;
  }

  async startSessionRecording(options?: { overdub?: boolean; clear?: boolean }) {
    await this.ensureStarted();
    this.session.startRecording(this, options);
  }

  async startOverdubRecording() {
    await this.ensureStarted();
    return this.session.startOverdub(this);
  }

  async stopSessionRecording() {
    return this.session.stopRecordingAsync(this);
  }

  getSessionTakes() {
    return this.session.getTakes();
  }

  setSessionTakes(takes: Gp9MidiEvent[][]) {
    this.session.setTakes(takes);
  }

  playbackNoteOn(midi: number, velocity = 96, time?: number) {
    if (!this.sampler || !this.ready) return;
    this.onVisualNote?.("noteOn", midi);
    const transposed = this.transposeMidi(midi);
    const gain = this.velocityToGain(this.shapedVelocity(velocity));
    const name = midiToNoteName(transposed);
    const t = time ?? Tone.now();
    const voice = this.voiceForMidi(midi);
    if (voice === "blend") {
      this.sampler.triggerAttack(name, t, gain);
      if (this.params.layerBlend > 0.02 && this.padSynth) {
        const freq = Tone.Frequency(transposed, "midi").toFrequency();
        this.padSynth.triggerAttack(freq, t, gain * 0.55);
        this.padActiveNotes.add(midi);
      }
      return;
    }
    if (voice === "piano") {
      this.sampler.triggerAttack(name, t, gain);
      return;
    }
    if (this.padSynth) {
      const freq = Tone.Frequency(transposed, "midi").toFrequency();
      this.padSynth.triggerAttack(freq, t, gain * 0.55);
      this.padActiveNotes.add(midi);
    }
  }

  playbackNoteOff(midi: number, time?: number) {
    if (!this.sampler || !this.ready) return;
    this.onVisualNote?.("noteOff", midi);
    const t = time ?? Tone.now();
    const voice = this.voiceForMidi(midi);
    if (voice === "blend") {
      const transposed = this.transposeMidi(midi);
      this.sampler.triggerRelease(midiToNoteName(transposed), t);
      this.triggerPadRelease(midi, t);
      return;
    }
    if (voice === "piano") {
      const transposed = this.transposeMidi(midi);
      this.sampler.triggerRelease(midiToNoteName(transposed), t);
      return;
    }
    this.triggerPadRelease(midi, t);
  }

  playSessionRecording(loop = false, tempo = 120) {
    const takes = this.session.getTakes();
    this.session.playSession(this, takes, loop, tempo);
  }

  pauseSessionPlayback() {
    return this.session.pausePlayback();
  }

  resumeSessionPlayback() {
    return this.session.resumePlayback();
  }

  isSessionPaused() {
    return this.session.isPaused();
  }

  stopSessionPlayback() {
    this.session.stopPlayback(this);
  }

  startPhraseLoop(
    steps: Gp9PhraseStep[],
    tempo: number,
    onStep?: (index: number) => void
  ) {
    this.session.startPhraseLoop(this, steps, tempo, onStep);
  }

  stopPhraseLoop() {
    this.session.stopPhraseLoop();
  }

  setArpeggiator(enabled: boolean, pattern: Gp9ArpPattern) {
    this.arpEnabled = enabled;
    this.session.setArp(enabled, pattern);
    if (!enabled) this.releaseAll();
  }

  isSessionRecording() {
    return this.session.isRecording();
  }

  isSessionPlaying() {
    return this.session.isPlayingBack();
  }

  isPhraseLooping() {
    return this.session.isPhraseLooping();
  }

  getSessionAudioUrl() {
    return this.session.getLastAudioUrl();
  }

  exportSessionAudio(filename = "gp9-session.webm") {
    const url = this.session.getLastAudioUrl();
    if (!url) return false;
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    return true;
  }

  async exportSessionWav(filename = "gp9-session.wav", tempo = 120) {
    const blob = await renderSessionTakesToWav(this.session.getTakes(), {
      transpose: this.params.transpose,
      tempo,
      masterVolume: this.params.masterVolume,
    });
    if (!blob) return false;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    return true;
  }

  getActiveNoteCount() {
    return this.activeNotes.size;
  }

  dispose() {
    this.metroLoop?.stop();
    this.metroLoop?.dispose();
    this.metroLoop = null;
    this.session.stopPlayback(this);
    this.session.stopPhraseLoop();
    this.session.stopArp();
    this.sampler?.dispose();
    this.padSynth?.dispose();
    this.crossFade?.dispose();
    this.padGain?.dispose();
    this.delay?.dispose();
    this.reverb?.dispose();
    this.chorus?.dispose();
    this.eq?.dispose();
    this.widener?.dispose();
    this.resonanceBus?.dispose();
    this.masterVolume?.dispose();
    this.keyOffNoise?.dispose();
    this.metroClick?.dispose();
    this.sampler = null;
    this.padSynth = null;
    this.crossFade = null;
    this.ready = false;
    Gp9PianoEngine.instance = null;
  }
}
