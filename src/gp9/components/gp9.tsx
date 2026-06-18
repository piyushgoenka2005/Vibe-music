"use client";

/**
 * GP-9 instrument UI — consolidated context, panels, and showroom shell.
 */
import dynamic from "next/dynamic";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { MidlifeGrain } from "@/gp9/components/midlife/midlife-grain";
import { MidlifePowerKnob } from "@/gp9/components/midlife/midlife-power-knob";
import { RotaryKnob } from "@/gp9/components/midlife/rotary-knob";
import {
  Gp9MotionButton,
  Gp9MotionLed,
  Gp9PanelStagger,
} from "@/gp9/components/gp9/gp9-motion";
import { cn } from "@/gp9/lib/utils";
import { useIsClient } from "@/hooks/useIsClient";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import {
  Gp9PianoEngine,
  Gp9WebMidi,
  GP9_PERFORMANCE_MODES,
  GP9_PRESETS,
  GP9_CAMERA_PRESETS,
  GP9_FINISHES,
  QWERTY_TO_MIDI,
  PIANO_KEYS,
  whiteKeyIndex,
  midiToNoteName,
  isHapticsSupported,
  isTouchDevice,
  isWebMidiSupported,
  triggerKeyHaptic,
  triggerPedalHaptic,
  getPerformanceMode,
  createDefaultPhraseSteps,
  type Gp9ArpPattern,
  type Gp9CameraPresetId,
  type Gp9FinishId,
  type Gp9MidiEvent,
  type Gp9PerformanceModeId,
  type Gp9PhraseStep,
  type Gp9PresetId,
  type Gp9SplitVoice,
  type Gp9TouchCurve,
} from "@/gp9/lib/gp9-runtime";

const ShowroomCanvas = dynamic(
  () => import("@/gp9/components/gp9-scene").then((m) => m.ShowroomCanvas),
  { ssr: false, loading: () => null }
);

// ============================================================================
// PIANO CONTEXT
// ============================================================================

export type Gp9ParamKey =
  | "masterVolume"
  | "reverb"
  | "brilliance"
  | "resonance"
  | "release"
  | "velocityCurve"
  | "stereoWidth"
  | "lidOpen"
  | "roomSize"
  | "keyOffNoise"
  | "delay"
  | "layerBlend";

export type Gp9InstrumentState = {
  powered: boolean;
  engineReady: boolean;
  presetId: Gp9PresetId;
  performanceModeId: Gp9PerformanceModeId;
  sustain: boolean;
  softPedal: boolean;
  sostenuto: boolean;
  activeNotes: Set<number>;
  qwertyHeld: Set<string>;
  masterVolume: number;
  reverb: number;
  brilliance: number;
  resonance: number;
  release: number;
  velocityCurve: number;
  touchCurve: Gp9TouchCurve;
  delay: number;
  layerBlend: number;
  splitEnabled: boolean;
  splitPoint: number | null;
  splitLowVoice: Gp9SplitVoice;
  splitHighVoice: Gp9SplitVoice;
  splitArmMode: boolean;
  stereoWidth: number;
  lidOpen: number;
  roomSize: number;
  keyOffNoise: number;
  headphoneMode: boolean;
  metronomeOn: boolean;
  tempo: number;
  metronomeLevel: number;
  transpose: number;
  recording: boolean;
  sessionEvents: Gp9MidiEvent[];
  hasSession: boolean;
  sessionPlaying: boolean;
  sessionLoopPlayback: boolean;
  phraseLoop: boolean;
  phraseSteps: Gp9PhraseStep[];
  phrasePlayhead: number | null;
  arpEnabled: boolean;
  arpPattern: Gp9ArpPattern;
  lastCapturedMidi: number;
  midiSupported: boolean;
  midiConnected: boolean;
  midiDeviceName: string | null;
  hapticsSupported: boolean;
  hapticsEnabled: boolean;
};

type Action =
  | { type: "SET_POWERED"; value: boolean }
  | { type: "SET_ENGINE_READY"; value: boolean }
  | { type: "SET_PRESET"; id: Gp9PresetId }
  | { type: "SET_PERFORMANCE_MODE"; id: Gp9PerformanceModeId }
  | { type: "SET_SUSTAIN"; value: boolean }
  | { type: "SET_SOFT_PEDAL"; value: boolean }
  | { type: "SET_SOSTENUTO"; value: boolean }
  | { type: "SET_HEADPHONE"; value: boolean }
  | { type: "SET_METRONOME"; value: boolean }
  | { type: "SET_TEMPO"; value: number }
  | { type: "SET_METRONOME_LEVEL"; value: number }
  | { type: "SET_TRANSPOSE"; value: number }
  | { type: "NOTE_ON"; midi: number }
  | { type: "NOTE_OFF"; midi: number }
  | { type: "QWERTY_DOWN"; key: string }
  | { type: "QWERTY_UP"; key: string }
  | { type: "SET_PARAM"; key: Gp9ParamKey; value: number }
  | { type: "SET_RECORDING"; value: boolean }
  | { type: "SET_SESSION"; events: Gp9MidiEvent[] }
  | { type: "SET_SESSION_PLAYING"; value: boolean }
  | { type: "SET_SESSION_LOOP"; value: boolean }
  | { type: "SET_PHRASE_LOOP"; value: boolean }
  | { type: "SET_PHRASE_STEPS"; steps: Gp9PhraseStep[] }
  | { type: "SET_PHRASE_PLAYHEAD"; index: number | null }
  | { type: "SET_ARP"; enabled: boolean; pattern?: Gp9ArpPattern }
  | { type: "SET_LAST_MIDI"; midi: number }
  | { type: "CLEAR_SESSION" }
  | { type: "CLEAR_ACTIVE_NOTES" }
  | { type: "SET_MIDI_SUPPORTED"; value: boolean }
  | { type: "SET_MIDI_CONNECTED"; connected: boolean; deviceName: string | null }
  | { type: "SET_HAPTICS_SUPPORTED"; value: boolean }
  | { type: "SET_HAPTICS"; value: boolean }
  | { type: "SET_TOUCH_CURVE"; value: Gp9TouchCurve }
  | { type: "SET_SPLIT_ENABLED"; value: boolean }
  | { type: "SET_SPLIT_POINT"; midi: number | null }
  | { type: "SET_SPLIT_ARM"; value: boolean }
  | {
      type: "SET_SPLIT_VOICES";
      low: Gp9SplitVoice;
      high: Gp9SplitVoice;
    };

const initialState: Gp9InstrumentState = {
  powered: false,
  engineReady: false,
  presetId: "concert",
  performanceModeId: "recital",
  sustain: false,
  softPedal: false,
  sostenuto: false,
  activeNotes: new Set(),
  qwertyHeld: new Set(),
  masterVolume: GP9_PRESETS[0].volume,
  reverb: GP9_PRESETS[0].reverb,
  brilliance: GP9_PRESETS[0].brilliance,
  resonance: GP9_PRESETS[0].resonance,
  release: GP9_PRESETS[0].release,
  velocityCurve: 0.65,
  touchCurve: "linear",
  delay: 0.12,
  layerBlend: 0,
  splitEnabled: false,
  splitPoint: null,
  splitLowVoice: "pad",
  splitHighVoice: "piano",
  splitArmMode: false,
  stereoWidth: GP9_PRESETS[0].stereoWidth,
  lidOpen: 0.65,
  roomSize: 0.5,
  keyOffNoise: 0.25,
  headphoneMode: false,
  metronomeOn: false,
  tempo: 96,
  metronomeLevel: 0.55,
  transpose: 0,
  recording: false,
  sessionEvents: [],
  hasSession: false,
  sessionPlaying: false,
  sessionLoopPlayback: false,
  phraseLoop: false,
  phraseSteps: createDefaultPhraseSteps(),
  phrasePlayhead: null,
  arpEnabled: false,
  arpPattern: "up",
  lastCapturedMidi: 60,
  midiSupported: false,
  midiConnected: false,
  midiDeviceName: null,
  hapticsSupported: false,
  hapticsEnabled: false,
};

function reducer(state: Gp9InstrumentState, action: Action): Gp9InstrumentState {
  switch (action.type) {
    case "SET_POWERED":
      return { ...state, powered: action.value };
    case "SET_ENGINE_READY":
      return { ...state, engineReady: action.value };
    case "SET_PRESET": {
      const preset = GP9_PRESETS.find((p) => p.id === action.id) ?? GP9_PRESETS[0];
      return {
        ...state,
        presetId: action.id,
        masterVolume: preset.volume,
        reverb: preset.reverb,
        brilliance: preset.brilliance,
        resonance: preset.resonance,
        release: preset.release,
        stereoWidth: preset.stereoWidth,
      };
    }
    case "SET_PERFORMANCE_MODE":
      return { ...state, performanceModeId: action.id };
    case "SET_SUSTAIN":
      return { ...state, sustain: action.value };
    case "SET_SOFT_PEDAL":
      return { ...state, softPedal: action.value };
    case "SET_SOSTENUTO":
      return { ...state, sostenuto: action.value };
    case "SET_HEADPHONE":
      return { ...state, headphoneMode: action.value };
    case "SET_METRONOME":
      return { ...state, metronomeOn: action.value };
    case "SET_TEMPO":
      return { ...state, tempo: action.value };
    case "SET_METRONOME_LEVEL":
      return { ...state, metronomeLevel: action.value };
    case "SET_TRANSPOSE":
      return { ...state, transpose: action.value };
    case "NOTE_ON": {
      const next = new Set(state.activeNotes);
      next.add(action.midi);
      return { ...state, activeNotes: next };
    }
    case "NOTE_OFF": {
      const next = new Set(state.activeNotes);
      next.delete(action.midi);
      return { ...state, activeNotes: next };
    }
    case "QWERTY_DOWN": {
      const next = new Set(state.qwertyHeld);
      next.add(action.key);
      return { ...state, qwertyHeld: next };
    }
    case "QWERTY_UP": {
      const next = new Set(state.qwertyHeld);
      next.delete(action.key);
      return { ...state, qwertyHeld: next };
    }
    case "SET_PARAM":
      return { ...state, [action.key]: action.value };
    case "SET_RECORDING":
      return { ...state, recording: action.value };
    case "SET_SESSION":
      return {
        ...state,
        sessionEvents: action.events,
        hasSession: action.events.length > 0,
      };
    case "SET_SESSION_PLAYING":
      return { ...state, sessionPlaying: action.value };
    case "SET_SESSION_LOOP":
      return { ...state, sessionLoopPlayback: action.value };
    case "SET_PHRASE_LOOP":
      return { ...state, phraseLoop: action.value };
    case "SET_PHRASE_STEPS":
      return { ...state, phraseSteps: action.steps };
    case "SET_PHRASE_PLAYHEAD":
      return { ...state, phrasePlayhead: action.index };
    case "SET_ARP":
      return {
        ...state,
        arpEnabled: action.enabled,
        arpPattern: action.pattern ?? state.arpPattern,
      };
    case "SET_LAST_MIDI":
      return { ...state, lastCapturedMidi: action.midi };
    case "CLEAR_SESSION":
      return {
        ...state,
        sessionEvents: [],
        hasSession: false,
        sessionPlaying: false,
        recording: false,
      };
    case "CLEAR_ACTIVE_NOTES":
      return { ...state, activeNotes: new Set() };
    case "SET_MIDI_SUPPORTED":
      return { ...state, midiSupported: action.value };
    case "SET_MIDI_CONNECTED":
      return {
        ...state,
        midiConnected: action.connected,
        midiDeviceName: action.deviceName,
      };
    case "SET_HAPTICS_SUPPORTED":
      return { ...state, hapticsSupported: action.value };
    case "SET_HAPTICS":
      return { ...state, hapticsEnabled: action.value };
    case "SET_TOUCH_CURVE":
      return { ...state, touchCurve: action.value };
    case "SET_SPLIT_ENABLED":
      return {
        ...state,
        splitEnabled: action.value,
        splitPoint: action.value && state.splitPoint === null ? 60 : state.splitPoint,
        splitArmMode: false,
      };
    case "SET_SPLIT_POINT":
      return { ...state, splitPoint: action.midi, splitArmMode: false };
    case "SET_SPLIT_ARM":
      return { ...state, splitArmMode: action.value };
    case "SET_SPLIT_VOICES":
      return {
        ...state,
        splitLowVoice: action.low,
        splitHighVoice: action.high,
      };
    default:
      return state;
  }
}

type Gp9PianoContextValue = {
  state: Gp9InstrumentState;
  powerOn: () => Promise<void>;
  setPreset: (id: Gp9PresetId) => void;
  setPerformanceMode: (id: Gp9PerformanceModeId) => void;
  setSustain: (on: boolean) => void;
  setSoftPedal: (on: boolean) => void;
  setSostenuto: (on: boolean) => void;
  setHeadphoneMode: (on: boolean) => void;
  setMetronome: (on: boolean) => void;
  setTempo: (bpm: number) => void;
  setMetronomeLevel: (level: number) => void;
  setTranspose: (semitones: number) => void;
  noteOn: (midi: number, velocity?: number) => Promise<void>;
  noteOff: (midi: number) => void;
  setParam: (key: Gp9ParamKey, value: number) => void;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  playSession: () => void;
  stopSessionPlayback: () => void;
  exportSession: () => void;
  clearSession: () => void;
  setSessionLoopPlayback: (on: boolean) => void;
  togglePhraseLoop: () => void;
  togglePhraseStep: (index: number) => void;
  setArpeggiator: (on: boolean, pattern?: Gp9ArpPattern) => void;
  connectMidi: () => Promise<void>;
  disconnectMidi: () => void;
  setHaptics: (on: boolean) => void;
  setTouchCurve: (curve: Gp9TouchCurve) => void;
  setSplitEnabled: (on: boolean) => void;
  setSplitPoint: (midi: number | null) => void;
  setSplitArmMode: (on: boolean) => void;
  setSplitVoices: (low: Gp9SplitVoice, high: Gp9SplitVoice) => void;
};

const Gp9PianoContext = createContext<Gp9PianoContextValue | null>(null);

export function Gp9PianoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const engine = useMemo(() => Gp9PianoEngine.getInstance(), []);
  const midiRef = useRef<Gp9WebMidi | null>(null);
  const externalMidiHeld = useRef(new Set<number>());

  const buildEngineParams = useCallback(
    (s: Gp9InstrumentState) => ({
      masterVolume: s.masterVolume,
      reverb: s.reverb,
      brilliance: s.brilliance,
      resonance: s.resonance,
      release: s.release,
      velocityCurve: s.velocityCurve,
      touchCurve: s.touchCurve,
      delay: s.delay,
      layerBlend: s.layerBlend,
      splitPoint: s.splitEnabled ? s.splitPoint : null,
      splitLowVoice: s.splitLowVoice,
      splitHighVoice: s.splitHighVoice,
      stereoWidth: s.stereoWidth,
      sustain: s.sustain,
      softPedal: s.softPedal,
      sostenuto: s.sostenuto,
      transpose: s.transpose,
      lidOpen: s.lidOpen,
      roomSize: s.roomSize,
      keyOffNoise: s.keyOffNoise,
      headphoneMode: s.headphoneMode,
      performanceModeId: s.performanceModeId,
      chorus: GP9_PRESETS.find((p) => p.id === s.presetId)?.chorus ?? 0.08,
    }),
    []
  );

  const syncEngine = useCallback(() => {
    engine.setParams(buildEngineParams(state));
  }, [engine, state, buildEngineParams]);

  useEffect(() => {
    if (!state.powered) return;
    syncEngine();
  }, [state.powered, syncEngine]);

  useEffect(() => {
    if (!state.powered) return;
    engine.setMetronome(state.metronomeOn, state.tempo, state.metronomeLevel);
  }, [engine, state.powered, state.metronomeOn, state.tempo, state.metronomeLevel]);

  const powerOn = useCallback(async () => {
    await engine.ensureStarted();
    dispatch({ type: "SET_POWERED", value: true });
    engine.applyPreset(state.presetId);
    engine.setParams(buildEngineParams({ ...state, powered: true }));

    const poll = window.setInterval(() => {
      if (engine.isReady()) {
        dispatch({ type: "SET_ENGINE_READY", value: true });
        window.clearInterval(poll);
      }
    }, 200);
    window.setTimeout(() => window.clearInterval(poll), 10000);
  }, [engine, state, buildEngineParams]);

  const setPreset = useCallback(
    (id: Gp9PresetId) => {
      dispatch({ type: "SET_PRESET", id });
      if (state.powered) engine.applyPreset(id);
    },
    [engine, state.powered]
  );

  const setPerformanceMode = useCallback(
    (id: Gp9PerformanceModeId) => {
      dispatch({ type: "SET_PERFORMANCE_MODE", id });
      if (state.powered) engine.setParams({ performanceModeId: id });
    },
    [engine, state.powered]
  );

  const setSustain = useCallback(
    (on: boolean) => {
      dispatch({ type: "SET_SUSTAIN", value: on });
      engine.setSustain(on);
    },
    [engine]
  );

  const setSoftPedal = useCallback(
    (on: boolean) => {
      dispatch({ type: "SET_SOFT_PEDAL", value: on });
      engine.setSoftPedal(on);
    },
    [engine]
  );

  const setSostenuto = useCallback(
    (on: boolean) => {
      dispatch({ type: "SET_SOSTENUTO", value: on });
      engine.setParams({ sostenuto: on });
    },
    [engine]
  );

  const setHeadphoneMode = useCallback(
    (on: boolean) => {
      dispatch({ type: "SET_HEADPHONE", value: on });
      if (state.powered) engine.setParams({ headphoneMode: on });
    },
    [engine, state.powered]
  );

  const setMetronome = useCallback(
    (on: boolean) => {
      dispatch({ type: "SET_METRONOME", value: on });
      if (state.powered) engine.setMetronome(on, state.tempo, state.metronomeLevel);
    },
    [engine, state.powered, state.tempo, state.metronomeLevel]
  );

  const setTempo = useCallback(
    (bpm: number) => {
      dispatch({ type: "SET_TEMPO", value: bpm });
      engine.setTempo(bpm);
      if (state.phraseLoop) {
        engine.stopPhraseLoop();
        engine.startPhraseLoop(state.phraseSteps, bpm, (index) => {
          dispatch({ type: "SET_PHRASE_PLAYHEAD", index });
        });
      }
    },
    [engine, state.phraseLoop, state.phraseSteps]
  );

  const setMetronomeLevel = useCallback(
    (level: number) => {
      dispatch({ type: "SET_METRONOME_LEVEL", value: level });
      if (state.powered && state.metronomeOn) {
        engine.setMetronome(true, state.tempo, level);
      }
    },
    [engine, state.powered, state.metronomeOn, state.tempo]
  );

  const setTranspose = useCallback(
    (semitones: number) => {
      const clamped = Math.max(-12, Math.min(12, semitones));
      dispatch({ type: "SET_TRANSPOSE", value: clamped });
      if (state.powered) engine.setParams({ transpose: clamped });
    },
    [engine, state.powered]
  );

  const noteOn = useCallback(
    async (midi: number, velocity = 96) => {
      await engine.ensureStarted();
      if (!state.powered) {
        dispatch({ type: "SET_POWERED", value: true });
        engine.applyPreset(state.presetId);
        engine.setParams(buildEngineParams({ ...state, powered: true }));
      }
      if (engine.isReady()) dispatch({ type: "SET_ENGINE_READY", value: true });
      dispatch({ type: "SET_LAST_MIDI", midi });
      dispatch({ type: "NOTE_ON", midi });
      engine.noteOn(midi, velocity);
    },
    [engine, state, buildEngineParams]
  );

  const noteOff = useCallback(
    (midi: number) => {
      dispatch({ type: "NOTE_OFF", midi });
      engine.noteOff(midi);
    },
    [engine]
  );

  const setParam = useCallback(
    (key: Gp9ParamKey, value: number) => {
      dispatch({ type: "SET_PARAM", key, value });
      if (state.powered) engine.setParams({ [key]: value });
    },
    [engine, state.powered]
  );

  const startRecording = useCallback(async () => {
    await powerOn();
    engine.stopSessionPlayback();
    engine.stopPhraseLoop();
    dispatch({ type: "SET_SESSION_PLAYING", value: false });
    dispatch({ type: "SET_PHRASE_LOOP", value: false });
    dispatch({ type: "SET_RECORDING", value: true });
    await engine.startSessionRecording();
  }, [engine, powerOn]);

  const stopRecording = useCallback(async () => {
    const result = await engine.stopSessionRecording();
    dispatch({ type: "SET_RECORDING", value: false });
    dispatch({ type: "SET_SESSION", events: result.takes.flat() });
  }, [engine]);

  const playSession = useCallback(() => {
    if (!state.hasSession) return;
    engine.stopPhraseLoop();
    dispatch({ type: "SET_PHRASE_LOOP", value: false });
    dispatch({ type: "SET_PHRASE_PLAYHEAD", index: null });
    engine.playSessionRecording(state.sessionLoopPlayback);
    dispatch({ type: "SET_SESSION_PLAYING", value: true });
  }, [engine, state.hasSession, state.sessionLoopPlayback]);

  const stopSessionPlayback = useCallback(() => {
    engine.stopSessionPlayback();
    dispatch({ type: "SET_SESSION_PLAYING", value: false });
    dispatch({ type: "SET_PHRASE_PLAYHEAD", index: null });
    dispatch({ type: "CLEAR_ACTIVE_NOTES" });
  }, [engine]);

  const exportSession = useCallback(() => {
    engine.exportSessionAudio();
  }, [engine]);

  const clearSession = useCallback(() => {
    engine.stopSessionPlayback();
    dispatch({ type: "CLEAR_SESSION" });
  }, [engine]);

  const setSessionLoopPlayback = useCallback((on: boolean) => {
    dispatch({ type: "SET_SESSION_LOOP", value: on });
  }, []);

  const togglePhraseLoop = useCallback(() => {
    const next = !state.phraseLoop;
    if (next) {
      engine.stopSessionPlayback();
      dispatch({ type: "SET_SESSION_PLAYING", value: false });
      engine.startPhraseLoop(state.phraseSteps, state.tempo, (index) => {
        dispatch({ type: "SET_PHRASE_PLAYHEAD", index });
      });
    } else {
      engine.stopPhraseLoop();
      dispatch({ type: "SET_PHRASE_PLAYHEAD", index: null });
      dispatch({ type: "CLEAR_ACTIVE_NOTES" });
    }
    dispatch({ type: "SET_PHRASE_LOOP", value: next });
  }, [engine, state.phraseLoop, state.phraseSteps, state.tempo]);

  const togglePhraseStep = useCallback(
    (index: number) => {
      const nextSteps = state.phraseSteps.map((s, i) =>
        i === index ? { ...s, active: !s.active } : s
      );
      dispatch({ type: "SET_PHRASE_STEPS", steps: nextSteps });
      if (state.phraseLoop) {
        engine.stopPhraseLoop();
        engine.startPhraseLoop(nextSteps, state.tempo, (i) => {
          dispatch({ type: "SET_PHRASE_PLAYHEAD", index: i });
        });
      }
    },
    [engine, state.phraseLoop, state.phraseSteps, state.tempo]
  );

  const setArpeggiator = useCallback(
    (on: boolean, pattern?: Gp9ArpPattern) => {
      const pat = pattern ?? state.arpPattern;
      dispatch({ type: "SET_ARP", enabled: on, pattern: pat });
      if (state.powered) engine.setArpeggiator(on, pat);
    },
    [engine, state.powered, state.arpPattern]
  );

  const connectMidi = useCallback(async () => {
    if (!isWebMidiSupported()) {
      dispatch({ type: "SET_MIDI_SUPPORTED", value: false });
      return;
    }
    await powerOn();

    midiRef.current?.disconnect();
    midiRef.current = new Gp9WebMidi({
      onNoteOn: (midi, velocity) => {
        externalMidiHeld.current.add(midi);
        void noteOn(midi, velocity);
      },
      onNoteOff: (midi) => {
        externalMidiHeld.current.delete(midi);
        noteOff(midi);
      },
      onSustain: (on) => setSustain(on),
      onSoftPedal: (on) => setSoftPedal(on),
      onSostenuto: (on) => setSostenuto(on),
    });

    const deviceName = await midiRef.current.connect();
    dispatch({
      type: "SET_MIDI_CONNECTED",
      connected: true,
      deviceName,
    });
  }, [noteOn, noteOff, powerOn, setSoftPedal, setSostenuto, setSustain]);

  const disconnectMidi = useCallback(() => {
    for (const midi of externalMidiHeld.current) {
      noteOff(midi);
    }
    externalMidiHeld.current.clear();
    midiRef.current?.disconnect();
    midiRef.current = null;
    dispatch({ type: "SET_MIDI_CONNECTED", connected: false, deviceName: null });
  }, [noteOff]);

  const setHaptics = useCallback((on: boolean) => {
    dispatch({ type: "SET_HAPTICS", value: on });
  }, []);

  const setTouchCurve = useCallback(
    (curve: Gp9TouchCurve) => {
      dispatch({ type: "SET_TOUCH_CURVE", value: curve });
      if (state.powered) engine.setParams({ touchCurve: curve });
    },
    [engine, state.powered]
  );

  const setSplitEnabled = useCallback(
    (on: boolean) => {
      dispatch({ type: "SET_SPLIT_ENABLED", value: on });
      if (state.powered) {
        engine.setParams({
          splitPoint: on ? (state.splitPoint ?? 60) : null,
        });
      }
    },
    [engine, state.powered, state.splitPoint]
  );

  const setSplitPoint = useCallback(
    (midi: number | null) => {
      dispatch({ type: "SET_SPLIT_POINT", midi });
      if (state.powered && state.splitEnabled) {
        engine.setParams({ splitPoint: midi });
      }
    },
    [engine, state.powered, state.splitEnabled]
  );

  const setSplitArmMode = useCallback((on: boolean) => {
    dispatch({ type: "SET_SPLIT_ARM", value: on });
  }, []);

  const setSplitVoices = useCallback(
    (low: Gp9SplitVoice, high: Gp9SplitVoice) => {
      dispatch({ type: "SET_SPLIT_VOICES", low, high });
      if (state.powered) engine.setParams({ splitLowVoice: low, splitHighVoice: high });
    },
    [engine, state.powered]
  );

  useEffect(() => {
    dispatch({ type: "SET_MIDI_SUPPORTED", value: isWebMidiSupported() });
    const hapticsOk = isHapticsSupported();
    dispatch({ type: "SET_HAPTICS_SUPPORTED", value: hapticsOk });
    if (hapticsOk && isTouchDevice()) {
      dispatch({ type: "SET_HAPTICS", value: true });
    }
  }, []);

  useEffect(() => {
    return () => {
      midiRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    const instance = Gp9PianoEngine.getInstance();
    instance.onVisualNote = (kind, midi) => {
      if (kind === "noteOn") dispatch({ type: "NOTE_ON", midi });
      else dispatch({ type: "NOTE_OFF", midi });
    };
    return () => {
      instance.onVisualNote = null;
    };
  }, []);

  useEffect(() => {
    if (!state.powered) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      const midi = QWERTY_TO_MIDI[key];
      if (midi === undefined) return;
      if (state.qwertyHeld.has(key)) return;
      e.preventDefault();
      dispatch({ type: "QWERTY_DOWN", key });
      void noteOn(midi, 88 + Math.random() * 24);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const midi = QWERTY_TO_MIDI[key];
      if (midi === undefined) return;
      dispatch({ type: "QWERTY_UP", key });
      noteOff(midi);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [state.powered, state.qwertyHeld, noteOn, noteOff]);

  const value = useMemo(
    () => ({
      state,
      powerOn,
      setPreset,
      setPerformanceMode,
      setSustain,
      setSoftPedal,
      setSostenuto,
      setHeadphoneMode,
      setMetronome,
      setTempo,
      setMetronomeLevel,
      setTranspose,
      noteOn,
      noteOff,
      setParam,
      startRecording,
      stopRecording,
      playSession,
      stopSessionPlayback,
      exportSession,
      clearSession,
      setSessionLoopPlayback,
      togglePhraseLoop,
      togglePhraseStep,
      setArpeggiator,
      connectMidi,
      disconnectMidi,
      setHaptics,
      setTouchCurve,
      setSplitEnabled,
      setSplitPoint,
      setSplitArmMode,
      setSplitVoices,
    }),
    [
      state,
      powerOn,
      setPreset,
      setPerformanceMode,
      setSustain,
      setSoftPedal,
      setSostenuto,
      setHeadphoneMode,
      setMetronome,
      setTempo,
      setMetronomeLevel,
      setTranspose,
      noteOn,
      noteOff,
      setParam,
      startRecording,
      stopRecording,
      playSession,
      stopSessionPlayback,
      exportSession,
      clearSession,
      setSessionLoopPlayback,
      togglePhraseLoop,
      togglePhraseStep,
      setArpeggiator,
      connectMidi,
      disconnectMidi,
      setHaptics,
      setTouchCurve,
      setSplitEnabled,
      setSplitPoint,
      setSplitArmMode,
      setSplitVoices,
    ]
  );

  return <Gp9PianoContext.Provider value={value}>{children}</Gp9PianoContext.Provider>;
}

export function useGp9Piano() {
  const ctx = useContext(Gp9PianoContext);
  if (!ctx) throw new Error("useGp9Piano must be used within Gp9PianoProvider");
  return ctx;
}

// ============================================================================
// HUD
// ============================================================================

export function Gp9HudDisplay() {
  const { state } = useGp9Piano();
  const preset = state.presetId.toUpperCase().replace("_", " ");
  const mode =
    GP9_PERFORMANCE_MODES.find((m) => m.id === state.performanceModeId)?.label.toUpperCase() ??
    "RECITAL";

  let copy: string;
  if (!state.powered) {
    copy =
      "GRAND PIANO 9 · PHASE 7\nSYSTEM STATUS: STANDBY\n\nKeyboard nav · focus rings · mobile touch targets.";
  } else if (!state.engineReady) {
    copy = "GRAND PIANO 9 · PHASE 7\nLOADING SAMPLES…\n\nInitializing Salamander concert grand.";
  } else {
    const sustain = state.sustain ? "HELD" : "OFF";
    const rec = state.recording
      ? "REC ●"
      : state.sessionPlaying
        ? "PLAYING"
        : state.hasSession
          ? `${state.sessionEvents.length} EVTS`
          : "IDLE";
    const loop = state.phraseLoop ? "PHRASE ON" : "PHRASE OFF";
    const arp = state.arpEnabled ? `ARP ${state.arpPattern.toUpperCase()}` : "ARP OFF";
    const touch = state.touchCurve.toUpperCase();
    const layer = Math.round(state.layerBlend * 100);
    const split = state.splitEnabled
      ? `SPLIT ${state.splitPoint !== null ? midiToNoteName(state.splitPoint) : "—"}`
      : "SPLIT OFF";
    copy = [
      "GRAND PIANO 9 · PLAYABLE",
      `MODE: ${mode} · PRESET: ${preset} · TOUCH: ${touch}`,
      `SESSION: ${rec} · ${loop} · ${arp}`,
      `TONE: LAYER ${layer}% · DELAY ${Math.round(state.delay * 100)}% · ${split}`,
      `TEMPO: ${state.tempo} BPM · SUSTAIN: ${sustain}`,
    ].join("\n");
  }

  return (
    <div
      className={cn("gp9-hud-display", state.recording && "gp9-hud-display--recording")}
      aria-live="polite"
    >
      <span className="gp9-hud-display-text">
        {copy}
        <span className="gp9-hud-cursor" aria-hidden>
          |
        </span>
      </span>
    </div>
  );
}

// ============================================================================
// INSTRUMENT CONSOLE
// ============================================================================

const KNOB_LABELS = ["VOLUME", "REVERB", "BRILLIANCE", "RESONANCE"] as const;

export function Gp9InstrumentConsole() {
  const { state, powerOn, setPreset, setParam } = useGp9Piano();

  return (
    <div className="gp9-console" id="gp9-console">
      <div className="gp9-console-top">
        <div className="midlife-zone gp9-console-power">
          <MidlifeGrain />
          <MidlifePowerKnob
            active={state.powered}
            onClick={() => {
              void powerOn();
            }}
          />
          <span className="gp9-console-power-label">POWER</span>
        </div>

        <div className="midlife-zone gp9-console-presets">
          <MidlifeGrain opacity={0.2} />
          <span className="gp9-console-section-label">PRESETS</span>
          <div className="gp9-preset-row">
            {GP9_PRESETS.map((preset) => (
              <Gp9MotionButton
                key={preset.id}
                type="button"
                className={cn(
                  "gp9-preset-btn",
                  state.presetId === preset.id && "gp9-preset-btn--active"
                )}
                onClick={() => {
                  void powerOn();
                  setPreset(preset.id);
                }}
                aria-pressed={state.presetId === preset.id}
                title={preset.description}
              >
                {preset.label.split(" ")[0]}
              </Gp9MotionButton>
            ))}
          </div>
        </div>

        <div className="midlife-zone gp9-console-knobs">
          <MidlifeGrain />
          <div className="gp9-knobs-scroll" data-lenis-prevent>
            <div className="gp9-knobs-row">
              <div className="gp9-knob-unit">
                <RotaryKnob
                  index={0}
                  spring
                  label={KNOB_LABELS[0]}
                  value={state.masterVolume}
                  onChange={(v) => setParam("masterVolume", v)}
                />
                <span>{KNOB_LABELS[0]}</span>
              </div>
              <div className="gp9-knob-unit">
                <RotaryKnob
                  index={1}
                  spring
                  label={KNOB_LABELS[1]}
                  value={state.reverb}
                  onChange={(v) => setParam("reverb", v)}
                />
                <span>{KNOB_LABELS[1]}</span>
              </div>
              <div className="gp9-knob-unit">
                <RotaryKnob
                  index={2}
                  spring
                  label={KNOB_LABELS[2]}
                  value={state.brilliance}
                  onChange={(v) => setParam("brilliance", v)}
                />
                <span>{KNOB_LABELS[2]}</span>
              </div>
              <div className="gp9-knob-unit">
                <RotaryKnob
                  index={3}
                  spring
                  label={KNOB_LABELS[3]}
                  value={state.resonance}
                  onChange={(v) => setParam("resonance", v)}
                />
                <span>{KNOB_LABELS[3]}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="gp9-phase-tag" aria-hidden>
        Phase 7 · A11y · Mobile · Performance
      </div>
    </div>
  );
}

// ============================================================================
// KEYBOARD
// ============================================================================

const WHITE_KEY_WIDTH = 28;
const SCROLL_ANCHORS = [
  { label: "LOW", midi: 36 },
  { label: "MID", midi: 60 },
  { label: "HIGH", midi: 96 },
] as const;

const whiteKeys = PIANO_KEYS.filter((k) => !k.black);
const blackKeys = PIANO_KEYS.filter((k) => k.black);
const totalWhite = whiteKeys.length;

export function Gp9Keyboard() {
  const { state, noteOn, noteOff, setSplitPoint } = useGp9Piano();
  const pointerHeld = useRef(new Set<number>());
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToMidi = useCallback((midi: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = whiteKeyIndex(midi);
    const target = idx * WHITE_KEY_WIDTH - el.clientWidth / 2 + WHITE_KEY_WIDTH / 2;
    el.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToMidi(60);
  }, [scrollToMidi]);

  const handleDown = useCallback(
    async (midi: number, velocity: number, fromTouch = false) => {
      if (state.splitArmMode && state.splitEnabled) {
        setSplitPoint(midi);
        return;
      }
      if (pointerHeld.current.has(midi)) return;
      pointerHeld.current.add(midi);
      if (fromTouch && state.hapticsEnabled) triggerKeyHaptic(velocity);
      await noteOn(midi, velocity);
    },
    [noteOn, state.hapticsEnabled, state.splitArmMode, state.splitEnabled, setSplitPoint]
  );

  const handleUp = useCallback(
    (midi: number) => {
      pointerHeld.current.delete(midi);
      noteOff(midi);
    },
    [noteOff]
  );

  const handleKeyPlayDown = useCallback(
    (midi: number) => (e: React.KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        void handleDown(midi, 88);
      }
    },
    [handleDown]
  );

  const handleKeyPlayUp = useCallback(
    (midi: number) => (e: React.KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleUp(midi);
      }
    },
    [handleUp]
  );

  return (
    <div className="gp9-keyboard-wrap" data-lenis-prevent>
      <div className="gp9-keyboard-toolbar">
        <span className="gp9-keyboard-range">
          A0 – C8 · 88 keys
          {state.splitArmMode ? " · tap key to set split" : ""}
        </span>
        <div className="gp9-keyboard-jumps">
          {SCROLL_ANCHORS.map(({ label, midi }) => (
            <Gp9MotionButton
              key={label}
              type="button"
              className="gp9-keyboard-jump"
              onClick={() => scrollToMidi(midi)}
              aria-label={`Jump keyboard to ${label} register`}
            >
              {label}
            </Gp9MotionButton>
          ))}
        </div>
      </div>

      <div className="gp9-keyboard-scroll" ref={scrollRef}>
        <div
          className="gp9-keyboard gp9-keyboard--full"
          style={{ width: totalWhite * WHITE_KEY_WIDTH + 16 }}
          role="group"
          aria-label="88-key piano keyboard"
        >
          {whiteKeys.map((key) => {
            const active = state.activeNotes.has(key.midi);
            const splitOn = state.splitEnabled && state.splitPoint !== null;
            return (
              <button
                key={key.midi}
                type="button"
                className={cn(
                  "gp9-key gp9-key--white",
                  active && "gp9-key--active",
                  splitOn && key.midi < state.splitPoint! && "gp9-key--split-low",
                  splitOn && key.midi >= state.splitPoint! && "gp9-key--split-high",
                  splitOn && key.midi === state.splitPoint && "gp9-key--split-point"
                )}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  const vel = 72 + Math.min(55, e.pressure > 0 ? e.pressure * 127 : 88);
                  const fromTouch = e.pointerType === "touch";
                  void handleDown(key.midi, vel, fromTouch);
                }}
                onPointerUp={() => handleUp(key.midi)}
                onPointerCancel={() => handleUp(key.midi)}
                onPointerLeave={(e) => {
                  if (!e.currentTarget.hasPointerCapture(e.pointerId)) handleUp(key.midi);
                }}
                onKeyDown={handleKeyPlayDown(key.midi)}
                onKeyUp={handleKeyPlayUp(key.midi)}
                aria-pressed={active}
                aria-label={`${key.name} key`}
              />
            );
          })}

          {blackKeys.map((key) => {
            const active = state.activeNotes.has(key.midi);
            const splitOn = state.splitEnabled && state.splitPoint !== null;
            const leftPx = (whiteKeyIndex(key.midi) + 0.72) * WHITE_KEY_WIDTH + 8;
            return (
              <button
                key={key.midi}
                type="button"
                className={cn(
                  "gp9-key gp9-key--black",
                  active && "gp9-key--active",
                  splitOn && key.midi < state.splitPoint! && "gp9-key--split-low",
                  splitOn && key.midi >= state.splitPoint! && "gp9-key--split-high",
                  splitOn && key.midi === state.splitPoint && "gp9-key--split-point"
                )}
                style={{ left: `${leftPx}px` }}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  const vel = 78 + Math.min(49, e.pressure > 0 ? e.pressure * 127 : 92);
                  const fromTouch = e.pointerType === "touch";
                  void handleDown(key.midi, vel, fromTouch);
                }}
                onPointerUp={() => handleUp(key.midi)}
                onPointerCancel={() => handleUp(key.midi)}
                onPointerLeave={(e) => {
                  if (!e.currentTarget.hasPointerCapture(e.pointerId)) handleUp(key.midi);
                }}
                onKeyDown={handleKeyPlayDown(key.midi)}
                onKeyUp={handleKeyPlayUp(key.midi)}
                aria-pressed={active}
                aria-label={`${key.name} key`}
              />
            );
          })}
        </div>
      </div>

      <p className="gp9-keyboard-hint">
        {!state.powered
          ? "Tap any key to power on · scroll for full 88 keys · QWERTY plays C3–C5"
          : state.engineReady
            ? `Mouse · touch · QWERTY · ${state.midiConnected ? "MIDI controller" : "connect MIDI above"}`
            : "Loading piano samples…"}
      </p>
    </div>
  );
}

// ============================================================================
// PEDALS
// ============================================================================

export function Gp9Pedals() {
  const { state, setSustain, setSoftPedal, setSostenuto, powerOn } = useGp9Piano();

  const ensure = async () => {
    if (!state.powered) await powerOn();
  };

  const tap = (e: React.PointerEvent, action: () => void) => {
    if (e.pointerType === "touch" && state.hapticsEnabled) triggerPedalHaptic();
    void action();
  };

  return (
    <div className="gp9-pedals">
      <Gp9MotionButton
        type="button"
        className={cn("gp9-pedal", state.sustain && "gp9-pedal--latched")}
        onPointerDown={(e) =>
          tap(e, async () => {
            await ensure();
            setSustain(!state.sustain);
          })
        }
        aria-pressed={state.sustain}
      >
        <Gp9MotionLed active={state.sustain} className="gp9-pedal-led" />
        SUSTAIN
      </Gp9MotionButton>
      <Gp9MotionButton
        type="button"
        className={cn("gp9-pedal", state.sostenuto && "gp9-pedal--latched")}
        onPointerDown={(e) =>
          tap(e, async () => {
            await ensure();
            setSostenuto(!state.sostenuto);
          })
        }
        aria-pressed={state.sostenuto}
      >
        <Gp9MotionLed active={state.sostenuto} className="gp9-pedal-led" />
        SOSTENUTO
      </Gp9MotionButton>
      <Gp9MotionButton
        type="button"
        className={cn("gp9-pedal", state.softPedal && "gp9-pedal--latched")}
        onPointerDown={(e) =>
          tap(e, async () => {
            await ensure();
            setSoftPedal(!state.softPedal);
          })
        }
        aria-pressed={state.softPedal}
      >
        <Gp9MotionLed active={state.softPedal} className="gp9-pedal-led" />
        SOFT
      </Gp9MotionButton>
    </div>
  );
}

// ============================================================================
// PERFORMANCE MODES UI
// ============================================================================

export function Gp9PerformanceModes() {
  const { state, powerOn, setPerformanceMode } = useGp9Piano();

  return (
    <div className="midlife-zone gp9-performance-modes">
      <MidlifeGrain opacity={0.2} />
      <span className="gp9-console-section-label">PERFORMANCE MODES</span>
      <div className="gp9-mode-row">
        {GP9_PERFORMANCE_MODES.map((mode) => (
          <Gp9MotionButton
            key={mode.id}
            type="button"
            className={cn(
              "gp9-mode-btn",
              state.performanceModeId === mode.id && "gp9-mode-btn--active"
            )}
            onClick={() => {
              void powerOn();
              setPerformanceMode(mode.id);
            }}
            aria-pressed={state.performanceModeId === mode.id}
            title={mode.description}
          >
            <Gp9MotionLed
              active={state.performanceModeId === mode.id}
              className="gp9-mode-btn-led"
            />
            {mode.label}
          </Gp9MotionButton>
        ))}
      </div>
      <p className="gp9-recorder-meta">
        Camera lerps on switch · Night slow orbit · Showcase rim spin
      </p>
    </div>
  );
}

// ============================================================================
// CONNECT PANEL
// ============================================================================

export function Gp9ConnectPanel() {
  const { state, connectMidi, disconnectMidi, setHaptics } = useGp9Piano();

  return (
    <div className="midlife-zone gp9-connect-panel">
      <MidlifeGrain opacity={0.15} />
      <span className="gp9-console-section-label">INPUTS · 88 KEYS</span>
      <div className="gp9-connect-row">
        {!state.midiConnected ? (
          <button
            type="button"
            className="gp9-connect-btn"
            disabled={!state.midiSupported}
            onClick={() => void connectMidi()}
          >
            CONNECT MIDI
          </button>
        ) : (
          <button type="button" className="gp9-connect-btn gp9-connect-btn--on" onClick={disconnectMidi}>
            DISCONNECT MIDI
          </button>
        )}

        <button
          type="button"
          className={cn(
            "gp9-connect-btn",
            state.hapticsEnabled && state.hapticsSupported && "gp9-connect-btn--on"
          )}
          disabled={!state.hapticsSupported}
          onClick={() => setHaptics(!state.hapticsEnabled)}
          aria-pressed={state.hapticsEnabled}
        >
          HAPTICS {state.hapticsEnabled ? "ON" : "OFF"}
        </button>
      </div>
      <p className="gp9-recorder-meta">
        {!state.midiSupported
          ? "Web MIDI not supported in this browser · use on-screen 88-key keyboard"
          : state.midiConnected
            ? `MIDI: ${state.midiDeviceName ?? "connected"} · sustain & pedals mapped`
            : "Plug a USB MIDI keyboard · scroll the 88-key keyboard below"}
        {state.hapticsSupported
          ? state.hapticsEnabled
            ? " · touch haptics enabled"
            : " · haptics off"
          : " · haptics unavailable"}
      </p>
    </div>
  );
}

// ============================================================================
// PHRASE SEQUENCER
// ============================================================================

const ARP_PATTERNS: { id: Gp9ArpPattern; label: string }[] = [
  { id: "up", label: "UP" },
  { id: "down", label: "DN" },
  { id: "updown", label: "UD" },
];

export function Gp9PhraseSequencer() {
  const { state, powerOn, togglePhraseLoop, togglePhraseStep, setArpeggiator } = useGp9Piano();

  return (
    <div className="midlife-zone gp9-phrase-panel">
      <MidlifeGrain opacity={0.15} />
      <div className="gp9-phrase-header">
        <span className="gp9-console-section-label">PHRASE LOOP · 16 STEPS</span>
        <div className="gp9-phrase-controls">
          <Gp9MotionButton
            type="button"
            className={cn("gp9-phrase-toggle", state.phraseLoop && "gp9-phrase-toggle--on")}
            onClick={async () => {
              await powerOn();
              togglePhraseLoop();
            }}
            aria-pressed={state.phraseLoop}
          >
            <Gp9MotionLed active={state.phraseLoop} className="gp9-transport-led" />
            {state.phraseLoop ? "LOOP ON" : "LOOP OFF"}
          </Gp9MotionButton>

          <Gp9MotionButton
            type="button"
            className={cn("gp9-phrase-toggle", state.arpEnabled && "gp9-phrase-toggle--on")}
            onClick={async () => {
              await powerOn();
              setArpeggiator(!state.arpEnabled);
            }}
            aria-pressed={state.arpEnabled}
          >
            ARP
          </Gp9MotionButton>

          {ARP_PATTERNS.map(({ id, label }) => (
            <Gp9MotionButton
              key={id}
              type="button"
              className={cn(
                "gp9-arp-pattern",
                state.arpPattern === id && state.arpEnabled && "gp9-arp-pattern--on"
              )}
              onClick={async () => {
                await powerOn();
                setArpeggiator(true, id);
              }}
              aria-pressed={state.arpPattern === id && state.arpEnabled}
            >
              {label}
            </Gp9MotionButton>
          ))}
        </div>
      </div>

      <div className="gp9-phrase-grid">
        {state.phraseSteps.map((step, i) => (
          <button
            key={i}
            type="button"
            className={cn(
              "gp9-phrase-step",
              step.active && "gp9-phrase-step--on",
              state.phrasePlayhead === i && state.phraseLoop && "gp9-phrase-step--playhead"
            )}
            onClick={async () => {
              await powerOn();
              togglePhraseStep(i);
            }}
            aria-pressed={step.active}
            title={midiToNoteName(step.midi)}
          >
            <span className="gp9-phrase-step-num">{i + 1}</span>
          </button>
        ))}
      </div>
      <p className="gp9-recorder-meta">
        Toggle steps to build a phrase · LOOP plays 16th notes at current tempo
        {state.arpEnabled ? " · ARP cycles held chord" : ""}
      </p>
    </div>
  );
}

// ============================================================================
// PIANO 3D VIEW
// ============================================================================

export function Gp9Piano3DView() {
  const { state } = useGp9Piano();
  const mounted = useIsClient();
  const reducedMotion = usePrefersReducedMotion();

  const playingBoost = state.activeNotes.size > 0 ? 1 : 0;

  if (reducedMotion) {
    return (
      <div className="gp9-scene-3d-fallback" aria-hidden>
        <span className="gp9-scene-3d-fallback-label">3D view · reduced motion</span>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="gp9-scene-3d-loading">
        <span>Initializing 3D…</span>
      </div>
    );
  }

  return (
    <div className="gp9-scene-3d-canvas" data-lenis-prevent>
      <ShowroomCanvas
        lidOpen={state.lidOpen}
        activeNotes={state.activeNotes}
        performanceModeId={state.performanceModeId}
        sustain={state.sustain}
        softPedal={state.softPedal}
        sostenuto={state.sostenuto}
        enableOrbit={false}
        playingBoost={playingBoost}
      />
      <p className="gp9-scene-3d-hint">
        Mode camera · choreography · keys sync live
      </p>
    </div>
  );
}

// ============================================================================
// RECORDER PANEL
// ============================================================================

export function Gp9RecorderPanel() {
  const {
    state,
    startRecording,
    stopRecording,
    playSession,
    stopSessionPlayback,
    exportSession,
    clearSession,
    setSessionLoopPlayback,
  } = useGp9Piano();

  const eventCount = state.sessionEvents.length;

  return (
    <div className="midlife-zone gp9-recorder-panel">
      <MidlifeGrain opacity={0.15} />
      <span className="gp9-console-section-label">SESSION RECORDER</span>
      <div className="gp9-recorder-row">
        {!state.recording ? (
          <Gp9MotionButton
            type="button"
            className="gp9-recorder-btn gp9-recorder-btn--record"
            onClick={() => void startRecording()}
          >
            <span className="gp9-recorder-dot" aria-hidden />
            RECORD
          </Gp9MotionButton>
        ) : (
          <Gp9MotionButton
            type="button"
            className="gp9-recorder-btn gp9-recorder-btn--stop"
            onClick={() => void stopRecording()}
          >
            <Gp9MotionLed active className="gp9-recorder-dot" variant="red" />
            STOP
          </Gp9MotionButton>
        )}

        <Gp9MotionButton
          type="button"
          className={cn("gp9-recorder-btn", state.sessionPlaying && "gp9-recorder-btn--on")}
          disabled={!state.hasSession}
          onClick={() => {
            if (state.sessionPlaying) stopSessionPlayback();
            else playSession();
          }}
        >
          {state.sessionPlaying ? "STOP PLAY" : "PLAY"}
        </Gp9MotionButton>

        <Gp9MotionButton
          type="button"
          className={cn(
            "gp9-recorder-btn",
            state.sessionLoopPlayback && "gp9-recorder-btn--on"
          )}
          disabled={!state.hasSession}
          onClick={() => setSessionLoopPlayback(!state.sessionLoopPlayback)}
          aria-pressed={state.sessionLoopPlayback}
        >
          <Gp9MotionLed active={state.sessionLoopPlayback} className="gp9-transport-led" />
          LOOP
        </Gp9MotionButton>

        <Gp9MotionButton
          type="button"
          className="gp9-recorder-btn"
          disabled={!state.hasSession}
          onClick={() => exportSession()}
        >
          EXPORT
        </Gp9MotionButton>

        <Gp9MotionButton
          type="button"
          className="gp9-recorder-btn"
          disabled={!state.hasSession && !state.recording}
          onClick={() => clearSession()}
        >
          CLEAR
        </Gp9MotionButton>
      </div>
      <p className="gp9-recorder-meta">
        {state.recording
          ? "Recording MIDI + audio… play to capture your performance."
          : state.hasSession
            ? `${eventCount} events captured · export downloads .webm audio`
            : "No session yet · press RECORD then play the keyboard"}
      </p>
    </div>
  );
}

// ============================================================================
// TONE CONTROLS
// ============================================================================

const TONE_KNOBS = [
  { key: "release" as const, label: "RELEASE", index: 0 },
  { key: "velocityCurve" as const, label: "SENS", index: 1 },
  { key: "delay" as const, label: "DELAY", index: 2 },
  { key: "layerBlend" as const, label: "LAYER", index: 3 },
  { key: "stereoWidth" as const, label: "WIDTH", index: 0 },
  { key: "roomSize" as const, label: "ROOM", index: 1 },
  { key: "lidOpen" as const, label: "LID", index: 2 },
  { key: "keyOffNoise" as const, label: "KEY-OFF", index: 3 },
];

const TOUCH_CURVES: { id: Gp9TouchCurve; label: string }[] = [
  { id: "soft", label: "SOFT" },
  { id: "linear", label: "LIN" },
  { id: "hard", label: "HARD" },
];

export function Gp9ToneControls() {
  const { state, setParam, setTouchCurve } = useGp9Piano();

  return (
    <div className="midlife-zone gp9-tone-controls">
      <MidlifeGrain opacity={0.15} />
      <span className="gp9-console-section-label">TONE REGULATION</span>
      <div className="gp9-touch-curve-row">
        <span className="gp9-touch-curve-label">TOUCH CURVE</span>
        {TOUCH_CURVES.map(({ id, label }) => (
          <Gp9MotionButton
            key={id}
            type="button"
            className={cn(
              "gp9-touch-curve-btn",
              state.touchCurve === id && "gp9-touch-curve-btn--on"
            )}
            onClick={() => setTouchCurve(id)}
            aria-pressed={state.touchCurve === id}
          >
            {label}
          </Gp9MotionButton>
        ))}
      </div>
      <div className="gp9-knobs-scroll gp9-knobs-scroll--tone" data-lenis-prevent>
        <div className="gp9-knobs-row gp9-knobs-row--wrap">
          {TONE_KNOBS.map(({ key, label, index }) => (
            <div key={key} className="gp9-knob-unit">
              <RotaryKnob
                index={index}
                spring
                label={label}
                value={state[key]}
                onChange={(v) => setParam(key, v)}
              />
              <span>{label}</span>
              <span className="gp9-knob-readout">{Math.round(state[key] * 100)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SPLIT PANEL
// ============================================================================

export function Gp9SplitPanel() {
  const {
    state,
    powerOn,
    setSplitEnabled,
    setSplitArmMode,
    setSplitVoices,
    setSplitPoint,
  } = useGp9Piano();

  const splitLabel =
    state.splitPoint !== null ? midiToNoteName(state.splitPoint) : "—";

  return (
    <div className="midlife-zone gp9-split-panel">
      <MidlifeGrain opacity={0.15} />
      <span className="gp9-console-section-label">SPLIT · LAYER</span>
      <div className="gp9-connect-row">
        <button
          type="button"
          className={cn("gp9-connect-btn", state.splitEnabled && "gp9-connect-btn--on")}
          onClick={async () => {
            await powerOn();
            setSplitEnabled(!state.splitEnabled);
          }}
          aria-pressed={state.splitEnabled}
        >
          SPLIT {state.splitEnabled ? "ON" : "OFF"}
        </button>
        <button
          type="button"
          className={cn(
            "gp9-connect-btn",
            state.splitArmMode && "gp9-connect-btn--on"
          )}
          disabled={!state.splitEnabled}
          onClick={() => setSplitArmMode(!state.splitArmMode)}
          aria-pressed={state.splitArmMode}
        >
          SET SPLIT
        </button>
        <button
          type="button"
          className="gp9-connect-btn"
          disabled={!state.splitEnabled}
          onClick={() => setSplitPoint(60)}
        >
          C4
        </button>
      </div>
      <div className="gp9-split-voices">
        <label className="gp9-split-voice-field">
          <span>LOW</span>
          <select
            className="gp9-split-select"
            value={state.splitLowVoice}
            disabled={!state.splitEnabled}
            aria-label="Split low voice"
            onChange={(e) =>
              setSplitVoices(e.target.value as Gp9SplitVoice, state.splitHighVoice)
            }
          >
            <option value="piano">Piano</option>
            <option value="pad">Pad</option>
          </select>
        </label>
        <label className="gp9-split-voice-field">
          <span>HIGH</span>
          <select
            className="gp9-split-select"
            value={state.splitHighVoice}
            disabled={!state.splitEnabled}
            aria-label="Split high voice"
            onChange={(e) =>
              setSplitVoices(state.splitLowVoice, e.target.value as Gp9SplitVoice)
            }
          >
            <option value="piano">Piano</option>
            <option value="pad">Pad</option>
          </select>
        </label>
      </div>
      <p className="gp9-recorder-meta">
        {state.splitArmMode
          ? "Click a key to set the split point"
          : state.splitEnabled
            ? `Split at ${splitLabel} · low=${state.splitLowVoice} · high=${state.splitHighVoice}`
            : "Layer blend knob mixes pad voice · enable split for bass/treble voices"}
      </p>
    </div>
  );
}

// ============================================================================
// TRANSPORT BAR
// ============================================================================

export function Gp9TransportBar() {
  const {
    state,
    powerOn,
    setMetronome,
    setTempo,
    setMetronomeLevel,
    setTranspose,
    setHeadphoneMode,
  } = useGp9Piano();

  return (
    <div className="midlife-zone gp9-transport">
      <MidlifeGrain opacity={0.15} />
      <div className="gp9-transport-grid">
        <Gp9MotionButton
          type="button"
          className={cn("gp9-transport-btn", state.metronomeOn && "gp9-transport-btn--on")}
          onClick={async () => {
            await powerOn();
            setMetronome(!state.metronomeOn);
          }}
          aria-pressed={state.metronomeOn}
        >
          <Gp9MotionLed active={state.metronomeOn} className="gp9-transport-led" />
          METRO
        </Gp9MotionButton>

        <label className="gp9-transport-field">
          <span>TEMPO</span>
          <div className="gp9-transport-tempo">
            <Gp9MotionButton
              type="button"
              className="gp9-transport-step"
              onClick={() => setTempo(Math.max(40, state.tempo - 1))}
              aria-label="Decrease tempo"
            >
              −
            </Gp9MotionButton>
            <output className="gp9-transport-value">{state.tempo}</output>
            <Gp9MotionButton
              type="button"
              className="gp9-transport-step"
              onClick={() => setTempo(Math.min(208, state.tempo + 1))}
              aria-label="Increase tempo"
            >
              +
            </Gp9MotionButton>
          </div>
        </label>

        <label className="gp9-transport-field gp9-transport-field--slider">
          <span>CLICK {Math.round(state.metronomeLevel * 100)}%</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(state.metronomeLevel * 100)}
            onChange={(e) => setMetronomeLevel(Number(e.target.value) / 100)}
            className="gp9-range"
          />
        </label>

        <label className="gp9-transport-field">
          <span>TRANSPOSE</span>
          <div className="gp9-transport-tempo">
            <Gp9MotionButton
              type="button"
              className="gp9-transport-step"
              onClick={() => setTranspose(state.transpose - 1)}
              aria-label="Transpose down"
            >
              −
            </Gp9MotionButton>
            <output className="gp9-transport-value">
              {state.transpose > 0 ? `+${state.transpose}` : state.transpose}
            </output>
            <Gp9MotionButton
              type="button"
              className="gp9-transport-step"
              onClick={() => setTranspose(state.transpose + 1)}
              aria-label="Transpose up"
            >
              +
            </Gp9MotionButton>
          </div>
        </label>

        <Gp9MotionButton
          type="button"
          className={cn("gp9-transport-btn", state.headphoneMode && "gp9-transport-btn--on")}
          onClick={async () => {
            await powerOn();
            setHeadphoneMode(!state.headphoneMode);
          }}
          aria-pressed={state.headphoneMode}
        >
          <Gp9MotionLed active={state.headphoneMode} className="gp9-transport-led" variant="blue" />
          PHONES
        </Gp9MotionButton>
      </div>
    </div>
  );
}

// ============================================================================
// INSTRUMENT PANEL
// ============================================================================

function Gp9InstrumentInner() {
  const { state } = useGp9Piano();
  const reducedMotion = usePrefersReducedMotion();
  const sceneClass = getPerformanceMode(state.performanceModeId).sceneClass;
  const isPlaying = state.activeNotes.size > 0;

  return (
    <div
      className={cn("gp9-instrument", reducedMotion && "gp9-instrument--reduce-motion")}
      data-lenis-prevent
    >
      <a href="#gp9-console" className="gp9-skip-link">
        Skip to instrument controls
      </a>
      <div className="gp9-instrument-header">
        <h3 className="gp9-instrument-title">Grand Piano 9</h3>
        <p className="gp9-instrument-sub">
          Phase 7 · Keyboard nav · 44px touch · reduced-motion safe
        </p>
      </div>

      <div className={cn("gp9-scene-wrap", sceneClass, isPlaying && "gp9-scene-wrap--playing")}>
        <div className="gp9-scene-glow" aria-hidden />
        <div className="midlife-chassis gp9-instrument-chassis">
          <div className="midlife-zone gp9-instrument-display-zone">
            <MidlifeGrain opacity={0.15} />
            <Gp9Piano3DView />
            <Gp9HudDisplay />
          </div>

          <Gp9PanelStagger>
            <Gp9PerformanceModes />
            <Gp9InstrumentConsole />
            <Gp9TransportBar />
            <Gp9RecorderPanel />
            <Gp9PhraseSequencer />
            <Gp9ConnectPanel />
            <Gp9SplitPanel />
            <Gp9ToneControls />
            <Gp9Keyboard />
            <Gp9Pedals />
          </Gp9PanelStagger>
        </div>
      </div>
    </div>
  );
}

export function Gp9InstrumentPanel() {
  return (
    <Gp9PianoProvider>
      <Gp9InstrumentInner />
    </Gp9PianoProvider>
  );
}

// ============================================================================
// SHOWROOM EXPERIENCE
// ============================================================================

export function ShowroomExperience() {
  const {
    state,
    powerOn,
    setPerformanceMode,
    setSustain,
    setParam,
    noteOn,
    noteOff,
  } = useGp9Piano();

  const [mounted, setMounted] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const [finishId, setFinishId] = useState<Gp9FinishId>("polished_ebony");
  const [cameraPreset, setCameraPreset] = useState<Gp9CameraPresetId>("performance");
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || reducedMotion) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMounted(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  const playingBoost = state.activeNotes.size > 0 ? 1 : 0;

  const handlePower = useCallback(async () => {
    await powerOn();
  }, [powerOn]);

  const demoChord = useCallback(async () => {
    await powerOn();
    const notes = [60, 64, 67, 72];
    for (const n of notes) await noteOn(n, 82);
    window.setTimeout(() => notes.forEach((n) => noteOff(n)), 900);
  }, [noteOn, noteOff, powerOn]);

  return (
    <div ref={sectionRef} className="gp9-showroom-experience" data-lenis-prevent>
      <div className="gp9-showroom-stage">
        {reducedMotion ? (
          <div
            className="gp9-showroom-fallback"
            role="img"
            aria-label="Roland GP-9 digital grand piano showroom view"
          />
        ) : mounted ? (
          <ShowroomCanvas
            lidOpen={state.lidOpen}
            activeNotes={state.activeNotes}
            performanceModeId={state.performanceModeId}
            finishId={finishId}
            sustain={state.sustain}
            softPedal={state.softPedal}
            sostenuto={state.sostenuto}
            playingBoost={playingBoost}
            cameraPreset={cameraPreset}
            enableOrbit={cameraPreset === "orbit"}
          />
        ) : (
          <div className="gp9-showroom-loading" role="status">
            <span>Scroll into view to load showroom…</span>
          </div>
        )}

        <div className="gp9-showroom-overlay" aria-hidden />

        <div className="gp9-showroom-hud">
          <div className="gp9-showroom-hud-top">
            <span className="gp9-showroom-badge">GP-9 SHOWROOM</span>
            <span className="gp9-showroom-status" aria-live="polite">
              {state.recording
                ? "● REC"
                : state.sessionPlaying
                  ? "▶ PLAYBACK"
                  : state.activeNotes.size > 0
                    ? `${state.activeNotes.size} keys`
                    : state.powered
                      ? "READY"
                      : "STANDBY"}
            </span>
          </div>

          <div className="gp9-showroom-controls" role="toolbar" aria-label="Showroom controls">
            <div className="gp9-showroom-control-group">
              <span className="gp9-showroom-control-label">CAMERA</span>
              <div className="gp9-showroom-pills">
                {GP9_CAMERA_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={cn(
                      "gp9-showroom-pill",
                      cameraPreset === p.id && "gp9-showroom-pill--on"
                    )}
                    onClick={() => setCameraPreset(p.id)}
                    aria-pressed={cameraPreset === p.id}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="gp9-showroom-control-group">
              <span className="gp9-showroom-control-label">FINISH</span>
              <div className="gp9-showroom-pills">
                {GP9_FINISHES.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={cn(
                      "gp9-showroom-pill",
                      finishId === f.id && "gp9-showroom-pill--on"
                    )}
                    onClick={() => setFinishId(f.id)}
                    aria-pressed={finishId === f.id}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="gp9-showroom-control-group">
              <span className="gp9-showroom-control-label">ENVIRONMENT</span>
              <div className="gp9-showroom-pills gp9-showroom-pills--wrap">
                {GP9_PERFORMANCE_MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={cn(
                      "gp9-showroom-pill",
                      state.performanceModeId === m.id && "gp9-showroom-pill--on"
                    )}
                    onClick={async () => {
                      await handlePower();
                      setPerformanceMode(m.id);
                    }}
                    aria-pressed={state.performanceModeId === m.id}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="gp9-showroom-actions">
            {!state.powered ? (
              <button type="button" className="gp9-showroom-cta" onClick={() => void handlePower()}>
                Power On
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="gp9-showroom-cta gp9-showroom-cta--ghost"
                  onClick={() => void demoChord()}
                >
                  Demo Chord
                </button>
                <button
                  type="button"
                  className={cn(
                    "gp9-showroom-cta gp9-showroom-cta--ghost",
                    state.sustain && "gp9-showroom-cta--on"
                  )}
                  onClick={async () => {
                    await handlePower();
                    setSustain(!state.sustain);
                  }}
                  aria-pressed={state.sustain}
                >
                  Sustain
                </button>
                <label className="gp9-showroom-lid">
                  <span>Lid</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(state.lidOpen * 100)}
                    onChange={(e) => setParam("lidOpen", Number(e.target.value) / 100)}
                    aria-label="Lid openness"
                  />
                </label>
              </>
            )}
          </div>
        </div>
      </div>

      <p className="gp9-showroom-foot">
        Luxury digital instrument showroom · 88 keys · velocity · MIDI · recording · real-time lighting
        {!state.powered ? " · Power on to play" : " · Scroll to Sound Lab for full instrument"}
      </p>
    </div>
  );
}
