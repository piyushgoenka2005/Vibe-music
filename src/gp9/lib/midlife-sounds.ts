import * as Tone from "tone";

export type SoundLayerId =
  | "bird"
  | "owl"
  | "forest"
  | "rain"
  | "plane"
  | "steps"
  | "static"
  | "wind"
  | "machine"
  | "flame"
  | "water"
  | "city"
  | "night"
  | "leaf";

export type LayerHandle = {
  start: () => void;
  stop: () => void;
  dispose: () => void;
};

function connectToBus<T extends Tone.ToneAudioNode>(node: T, bus: Tone.ToneAudioNode): T {
  node.connect(bus);
  return node;
}

export function createBirdLayer(bus: Tone.ToneAudioNode): LayerHandle {
  const synth = connectToBus(
    new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.01, decay: 0.08, sustain: 0, release: 0.1 } }),
    bus
  );
  synth.volume.value = -14;
  const loop = new Tone.Loop((time) => {
    if (Math.random() > 0.35) {
      synth.triggerAttackRelease(Tone.Frequency("C6").transpose(Math.floor(Math.random() * 8)).toFrequency(), "16n", time);
    }
  }, "4n");
  return {
    start: () => loop.start(0),
    stop: () => loop.stop(),
    dispose: () => {
      loop.dispose();
      synth.dispose();
    },
  };
}

export function createOwlLayer(bus: Tone.ToneAudioNode): LayerHandle {
  const synth = connectToBus(
    new Tone.FMSynth({ harmonicity: 2, modulationIndex: 1.2, envelope: { attack: 0.2, decay: 0.4, sustain: 0.1, release: 0.8 } }),
    bus
  );
  const loop = new Tone.Loop((time) => {
    synth.triggerAttackRelease("A2", "2n", time);
  }, "2m");
  return {
    start: () => loop.start(0),
    stop: () => loop.stop(),
    dispose: () => {
      loop.dispose();
      synth.dispose();
    },
  };
}

export function createNoiseLayer(bus: Tone.ToneAudioNode, type: Tone.NoiseType, filterFreq = 1200): LayerHandle {
  const filter = new Tone.Filter(filterFreq, "bandpass").connect(bus);
  const noise = new Tone.Noise(type).connect(filter);
  noise.volume.value = -18;
  return {
    start: () => noise.start(),
    stop: () => noise.stop(),
    dispose: () => {
      noise.dispose();
      filter.dispose();
    },
  };
}

export function createPlaneLayer(bus: Tone.ToneAudioNode): LayerHandle {
  const osc = new Tone.Oscillator(90, "sawtooth").connect(bus);
  osc.volume.value = -20;
  const lfo = new Tone.LFO(0.15, 85, 95);
  lfo.connect(osc.frequency);
  return {
    start: () => {
      osc.start();
      lfo.start();
    },
    stop: () => {
      osc.stop();
      lfo.stop();
    },
    dispose: () => {
      osc.dispose();
      lfo.dispose();
    },
  };
}

export function createStepsLayer(bus: Tone.ToneAudioNode): LayerHandle {
  const gain = new Tone.Gain(0).connect(bus);
  const noise = new Tone.Noise("brown").connect(gain);
  const loop = new Tone.Loop((time) => {
    gain.gain.setValueAtTime(0.35, time);
    gain.gain.setValueAtTime(0, time + 0.04);
    gain.gain.setValueAtTime(0.3, time + 0.2);
    gain.gain.setValueAtTime(0, time + 0.24);
  }, "2n");
  return {
    start: () => {
      noise.start();
      loop.start(0);
    },
    stop: () => {
      loop.stop();
      noise.stop();
      gain.gain.setValueAtTime(0, Tone.now());
    },
    dispose: () => {
      loop.dispose();
      noise.dispose();
      gain.dispose();
    },
  };
}

export function createMachineLayer(bus: Tone.ToneAudioNode): LayerHandle {
  const osc = new Tone.Oscillator(55, "square").connect(bus);
  osc.volume.value = -22;
  const lfo = new Tone.LFO(4, -28, -18);
  lfo.connect(osc.volume);
  return {
    start: () => {
      osc.start();
      lfo.start();
    },
    stop: () => {
      osc.stop();
      lfo.stop();
    },
    dispose: () => {
      osc.dispose();
      lfo.dispose();
    },
  };
}

export function createFlameLayer(bus: Tone.ToneAudioNode): LayerHandle {
  const noise = connectToBus(new Tone.Noise("pink"), bus);
  const loop = new Tone.Loop((time) => {
    noise.volume.rampTo(-18 + Math.random() * 8, 0.05, time);
  }, "16n");
  return {
    start: () => {
      noise.start();
      loop.start(0);
    },
    stop: () => {
      loop.stop();
      noise.stop();
    },
    dispose: () => {
      loop.dispose();
      noise.dispose();
    },
  };
}

export function createPadLayer(bus: Tone.ToneAudioNode, note: string): LayerHandle {
  const synth = connectToBus(
    new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 1.5, decay: 0.5, sustain: 0.8, release: 2 },
    }),
    bus
  );
  return {
    start: () => synth.triggerAttack(note, Tone.now()),
    stop: () => synth.releaseAll(),
    dispose: () => synth.dispose(),
  };
}

export function createLeafLayer(bus: Tone.ToneAudioNode): LayerHandle {
  const noise = connectToBus(new Tone.Noise("white"), bus);
  noise.volume.value = -28;
  const loop = new Tone.Loop((time) => {
    if (Math.random() > 0.6) noise.volume.rampTo(-22, 0.02, time);
    else noise.volume.rampTo(-32, 0.1, time);
  }, "8n");
  return {
    start: () => {
      noise.start();
      loop.start(0);
    },
    stop: () => {
      loop.stop();
      noise.stop();
    },
    dispose: () => {
      loop.dispose();
      noise.dispose();
    },
  };
}

export function createLayer(id: SoundLayerId, bus: Tone.ToneAudioNode): LayerHandle {
  switch (id) {
    case "bird":
      return createBirdLayer(bus);
    case "owl":
      return createOwlLayer(bus);
    case "forest":
      return createNoiseLayer(bus, "brown", 400);
    case "rain":
      return createNoiseLayer(bus, "pink", 1800);
    case "plane":
      return createPlaneLayer(bus);
    case "steps":
      return createStepsLayer(bus);
    case "static":
      return createNoiseLayer(bus, "white", 3000);
    case "wind":
      return createNoiseLayer(bus, "pink", 600);
    case "machine":
      return createMachineLayer(bus);
    case "flame":
      return createFlameLayer(bus);
    case "water":
      return createNoiseLayer(bus, "pink", 2400);
    case "city":
      return createNoiseLayer(bus, "brown", 900);
    case "night":
      return createPadLayer(bus, "D2");
    case "leaf":
      return createLeafLayer(bus);
    default:
      return createNoiseLayer(bus, "white");
  }
}

export const SOUND_LAYERS: { id: SoundLayerId; label: string }[] = [
  { id: "bird", label: "Birds" },
  { id: "owl", label: "Owl" },
  { id: "forest", label: "Forest" },
  { id: "rain", label: "Rain" },
  { id: "plane", label: "Flight" },
  { id: "steps", label: "Footsteps" },
  { id: "static", label: "Static" },
  { id: "wind", label: "Wind" },
  { id: "machine", label: "Machine" },
  { id: "flame", label: "Fire" },
  { id: "water", label: "Water" },
  { id: "city", label: "City" },
  { id: "night", label: "Night" },
  { id: "leaf", label: "Leaf" },
];
